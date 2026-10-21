-- KHLA Shop core: inventory, orders, reservations, Stripe webhook dedupe.
--
-- Supabase Postgres, server-only access:
--   * All tables live in `public` with RLS enabled and NO anon/authenticated
--     policies, so PostgREST cannot read or write them for those roles.
--   * Table and function privileges are revoked from PUBLIC/anon/authenticated
--     and granted to service_role only. On Supabase service_role has
--     BYPASSRLS, so the SECURITY INVOKER functions below run with full access.
--   * Every function is SECURITY INVOKER with `search_path = ''` and all
--     objects are schema-qualified, so a caller cannot shadow a name.
--   * No card data, user IDs, or checkout secrets are stored here.
--
-- Stock invariant:
--   available = public.shop_inventory.on_hand - public.shop_inventory.reserved
--   Pending orders only increase `reserved`; physical stock (`on_hand`) is
--   decremented exactly once, when Stripe confirms payment (shop_mark_paid)
--   `on_hand >= reserved` holds at every step. Every change to `on_hand`
--   writes a public.shop_stock_ledger row, so sum(delta) per SKU = on_hand.
--
-- Late paid handling:
--   The buyer's money has moved, so a paid event is honoured whenever stock
--   allows. A hold that is still active is committed even if its expiry time
--   has passed. If the hold was already released (expired/canceled order), the
--   units are taken from available stock; only when stock is short, or the
--   amount is below the order subtotal, does the order move to
--   `payment_review` for a human to refund or reconcile. Webhook event IDs are
--   inserted in the same transaction as the state change.
--
-- Scope: one SKU per order (single-product slice). A multi-item cart needs
--   shop_reserve_order to take an item array; the tables already allow it.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.shop_inventory (
  sku        text primary key,
  on_hand    integer not null default 0 check (on_hand >= 0),
  reserved   integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now(),
  constraint shop_inventory_reserved_le_on_hand check (on_hand >= reserved)
);

comment on table public.shop_inventory is
  'Per-SKU stock. available = on_hand - reserved; on_hand only changes on confirmed payment.';
comment on column public.shop_inventory.on_hand is
  'Physical units on hand. Decremented exactly once per paid order.';
comment on column public.shop_inventory.reserved is
  'Units held by active pending reservations; never allowed to exceed on_hand.';

create table if not exists public.shop_orders (
  id                       uuid primary key default gen_random_uuid(),
  lookup_token             uuid not null unique default gen_random_uuid(),
  status                   text not null default 'pending'
                             check (status in ('pending', 'paid', 'canceled', 'expired', 'payment_review')),
  currency                 text not null default 'usd' check (currency = 'usd'),
  subtotal_amount          integer not null check (subtotal_amount >= 0),
  stripe_session_id        text unique,
  stripe_payment_intent_id text unique,
  email                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.shop_orders is
  'Order header. lookup_token is the buyer-facing non-guessable key; no user IDs.';
comment on column public.shop_orders.subtotal_amount is
  'Merchandise subtotal in USD cents (excludes shipping and tax).';

create table if not exists public.shop_order_items (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.shop_orders (id) on delete cascade,
  sku         text not null,
  title       text not null,
  quantity    integer not null check (quantity > 0),
  unit_amount integer not null check (unit_amount >= 0),
  created_at  timestamptz not null default now()
);

comment on table public.shop_order_items is
  'Immutable per-order item snapshot, USD cents.';

create table if not exists public.shop_reservations (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.shop_orders (id) on delete cascade,
  sku        text not null references public.shop_inventory (sku),
  quantity   integer not null check (quantity > 0),
  status     text not null default 'active'
               check (status in ('active', 'committed', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shop_reservations is
  'Stock hold lifecycle: active -> committed (paid) or released (expired/canceled/failed).';

create table if not exists public.shop_webhook_events (
  event_id   text primary key,
  order_id   uuid references public.shop_orders (id) on delete set null,
  event_type text,
  created_at timestamptz not null default now()
);

comment on table public.shop_webhook_events is
  'Stripe webhook dedupe; the row is inserted in the same transaction as the state change.';

create table if not exists public.shop_stock_ledger (
  id         bigint generated always as identity primary key,
  sku        text not null references public.shop_inventory (sku),
  delta      integer not null check (delta <> 0),
  reason     text not null check (reason in ('opening', 'adjustment', 'sale')),
  order_id   uuid references public.shop_orders (id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.shop_stock_ledger is
  'Append-only audit of every on_hand change. sum(delta) per SKU equals shop_inventory.on_hand.';

create index if not exists shop_stock_ledger_sku_idx
  on public.shop_stock_ledger (sku);
create index if not exists shop_order_items_order_id_idx
  on public.shop_order_items (order_id);
create index if not exists shop_reservations_order_id_idx
  on public.shop_reservations (order_id);
create index if not exists shop_reservations_active_expiry_idx
  on public.shop_reservations (expires_at) where status = 'active';
create index if not exists shop_orders_status_idx
  on public.shop_orders (status);

-- ---------------------------------------------------------------------------
-- RPC: reserve
-- ---------------------------------------------------------------------------

create or replace function public.shop_reserve_order(
  p_order_id uuid,
  p_sku text,
  p_title text,
  p_quantity integer,
  p_unit_amount integer,
  p_expires_at timestamptz
) returns table (order_id uuid, lookup_token uuid, expires_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
-- The RETURNS TABLE columns share names with table columns; they are only ever
-- filled through RETURN QUERY, so a bare name always means the column.
#variable_conflict use_column
declare
  v_lookup_token uuid;
  v_subtotal integer;
  v_expires timestamptz;
  v_sku text;
  v_title text;
  v_qty integer;
  v_unit integer;
begin
  if p_order_id is null then
    raise exception 'p_order_id is required' using errcode = '22023';
  end if;
  if p_sku is null or length(btrim(p_sku)) = 0 or length(p_sku) > 200 then
    raise exception 'p_sku is required' using errcode = '22023';
  end if;
  if p_title is null or length(btrim(p_title)) = 0 or length(p_title) > 500 then
    raise exception 'p_title is required' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 1000 then
    raise exception 'p_quantity must be between 1 and 1000' using errcode = '22023';
  end if;
  if p_unit_amount is null or p_unit_amount < 0 then
    raise exception 'p_unit_amount must be >= 0' using errcode = '22023';
  end if;
  if p_quantity::bigint * p_unit_amount::bigint > 2147483647 then
    raise exception 'order subtotal overflows integer cents' using errcode = '22023';
  end if;
  v_subtotal := p_quantity * p_unit_amount;

  -- Claim the caller-supplied UUID first: it is the Stripe idempotency root.
  -- A same-UUID retry with identical content returns the existing order and
  -- never touches stock again.
  insert into public.shop_orders (id, status, currency, subtotal_amount)
  values (p_order_id, 'pending', 'usd', v_subtotal)
  on conflict (id) do nothing
  returning lookup_token into v_lookup_token;

  if v_lookup_token is null then
    select o.lookup_token into v_lookup_token
      from public.shop_orders o
     where o.id = p_order_id;

    select i.sku, i.title, i.quantity, i.unit_amount
      into v_sku, v_title, v_qty, v_unit
      from public.shop_order_items i
     where i.order_id = p_order_id
     order by i.id
     limit 1;

    if not found then
      raise exception 'order % exists without an item snapshot; refusing retry', p_order_id
        using errcode = '22023';
    end if;
    if v_sku is distinct from p_sku
       or v_title is distinct from p_title
       or v_qty is distinct from p_quantity
       or v_unit is distinct from p_unit_amount then
      raise exception 'idempotency mismatch for order %', p_order_id using errcode = '22023';
    end if;

    select r.expires_at into v_expires
      from public.shop_reservations r
     where r.order_id = p_order_id and r.status = 'active'
     order by r.id
     limit 1;

    return query select p_order_id, v_lookup_token, v_expires;
    return;
  end if;

  if p_expires_at is null or p_expires_at <= now() then
    raise exception 'p_expires_at must be in the future' using errcode = '22023';
  end if;

  -- Atomic conditional hold. The UPDATE re-evaluates its predicate against the
  -- locked row, so concurrent last-unit buyers serialize and exactly one wins.
  update public.shop_inventory
     set reserved = reserved + p_quantity,
         updated_at = now()
   where sku = p_sku
     and (on_hand - reserved) >= p_quantity;

  if not found then
    if exists (select 1 from public.shop_inventory where sku = p_sku) then
      raise exception 'insufficient stock for sku %', p_sku using errcode = 'P0001';
    end if;
    raise exception 'unknown sku %', p_sku using errcode = 'P0002';
  end if;

  insert into public.shop_order_items (order_id, sku, title, quantity, unit_amount)
  values (p_order_id, p_sku, p_title, p_quantity, p_unit_amount);

  insert into public.shop_reservations (order_id, sku, quantity, status, expires_at)
  values (p_order_id, p_sku, p_quantity, 'active', p_expires_at)
  returning expires_at into v_expires;

  return query select p_order_id, v_lookup_token, v_expires;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: attach Stripe session
-- ---------------------------------------------------------------------------

create or replace function public.shop_attach_session(
  p_order_id uuid,
  p_session_id text
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_session text;
begin
  if p_order_id is null then
    raise exception 'p_order_id is required' using errcode = '22023';
  end if;
  if p_session_id is null or length(btrim(p_session_id)) = 0 or length(p_session_id) > 200 then
    raise exception 'p_session_id is required' using errcode = '22023';
  end if;

  select o.status, o.stripe_session_id into v_status, v_session
    from public.shop_orders o
   where o.id = p_order_id
   for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;
  if v_status <> 'pending' then
    raise exception 'order % is % and cannot attach a session', p_order_id, v_status
      using errcode = 'P0001';
  end if;
  -- Replaying the same session is fine; a different session is a mismatch.
  if v_session is not null and v_session <> p_session_id then
    raise exception 'order % already bound to a different session', p_order_id
      using errcode = '22023';
  end if;

  update public.shop_orders
     set stripe_session_id = p_session_id,
         updated_at = now()
   where id = p_order_id;

  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mark paid
-- ---------------------------------------------------------------------------

create or replace function public.shop_mark_paid(
  p_event_id text,
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_total integer,
  p_email text
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted text;
  v_status text;
  v_session text;
  v_subtotal integer;
  v_res_id bigint;
  v_sku text;
  v_qty integer;
begin
  if p_event_id is null or length(btrim(p_event_id)) = 0 or length(p_event_id) > 200 then
    raise exception 'p_event_id is required' using errcode = '22023';
  end if;
  if p_order_id is null then
    raise exception 'p_order_id is required' using errcode = '22023';
  end if;
  if p_session_id is null or length(btrim(p_session_id)) = 0 or length(p_session_id) > 200 then
    raise exception 'p_session_id is required' using errcode = '22023';
  end if;
  if p_payment_intent_id is null or length(btrim(p_payment_intent_id)) = 0
     or length(p_payment_intent_id) > 200 then
    raise exception 'p_payment_intent_id is required' using errcode = '22023';
  end if;
  if p_amount_total is null or p_amount_total < 0 then
    raise exception 'p_amount_total must be >= 0' using errcode = '22023';
  end if;
  if p_email is not null and length(p_email) > 320 then
    raise exception 'p_email is too long' using errcode = '22023';
  end if;

  -- Dedupe first, in the same transaction as the state change. A replay finds
  -- the event row and returns the current status without touching stock.
  insert into public.shop_webhook_events (event_id, order_id, event_type)
  values (p_event_id, p_order_id, 'checkout.session.completed')
  on conflict (event_id) do nothing
  returning event_id into v_inserted;

  if v_inserted is null then
    select o.status into v_status
      from public.shop_webhook_events e
      join public.shop_orders o on o.id = e.order_id
     where e.event_id = p_event_id;
    return coalesce(v_status, 'unknown');
  end if;

  select o.status, o.stripe_session_id, o.subtotal_amount
    into v_status, v_session, v_subtotal
    from public.shop_orders o
   where o.id = p_order_id
   for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  -- Bind the session if it was never attached, otherwise it must match.
  if v_session is null then
    v_session := p_session_id;
  elsif v_session <> p_session_id then
    raise exception 'session mismatch for order %', p_order_id using errcode = '22023';
  end if;

  update public.shop_orders
     set stripe_session_id = v_session,
         stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_payment_intent_id),
         email = coalesce(p_email, email),
         updated_at = now()
   where id = p_order_id;

  -- Paid stays paid; flagged orders stay flagged on replay.
  if v_status = 'paid' or v_status = 'payment_review' then
    return v_status;
  end if;

  select i.sku, i.quantity into v_sku, v_qty
    from public.shop_order_items i
   where i.order_id = p_order_id
   order by i.id
   limit 1;

  if not found then
    raise exception 'order % has no item snapshot', p_order_id using errcode = 'P0002';
  end if;

  select r.id into v_res_id
    from public.shop_reservations r
   where r.order_id = p_order_id and r.status = 'active'
   order by r.id
   limit 1
   for update;

  if p_amount_total < v_subtotal then
    -- Underpaid relative to the merchandise subtotal: do not fulfil, flag.
    if v_res_id is not null then
      update public.shop_reservations set status = 'released', updated_at = now()
       where id = v_res_id;
      update public.shop_inventory set reserved = reserved - v_qty, updated_at = now()
       where sku = v_sku;
    end if;
    update public.shop_orders set status = 'payment_review', updated_at = now()
     where id = p_order_id;
    return 'payment_review';
  end if;

  if v_res_id is not null then
    -- Live hold (even past its expiry time, as long as nothing released it):
    -- commit it. on_hand >= reserved is preserved because the active hold
    -- guarantees reserved >= quantity.
    update public.shop_inventory
       set on_hand = on_hand - v_qty,
           reserved = reserved - v_qty,
           updated_at = now()
     where sku = v_sku;

    update public.shop_reservations set status = 'committed', updated_at = now()
     where id = v_res_id;
  else
    -- Late paid: the hold was already released. Take the units from available
    -- stock if they are still there; otherwise flag for a human.
    update public.shop_inventory
       set on_hand = on_hand - v_qty, updated_at = now()
     where sku = v_sku
       and (on_hand - reserved) >= v_qty;

    if not found then
      update public.shop_orders set status = 'payment_review', updated_at = now()
       where id = p_order_id;
      return 'payment_review';
    end if;
  end if;

  insert into public.shop_stock_ledger (sku, delta, reason, order_id)
  values (v_sku, -v_qty, 'sale', p_order_id);

  update public.shop_orders set status = 'paid', updated_at = now()
   where id = p_order_id;

  return 'paid';
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: release (canceled / expired / async failure)
-- ---------------------------------------------------------------------------

create or replace function public.shop_release_order(
  p_event_id text,
  p_order_id uuid,
  p_session_id text,
  p_final_status text
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted text;
  v_status text;
  v_session text;
  v_res_id bigint;
  v_res_sku text;
  v_res_qty integer;
begin
  if p_event_id is null or length(btrim(p_event_id)) = 0 or length(p_event_id) > 200 then
    raise exception 'p_event_id is required' using errcode = '22023';
  end if;
  if p_order_id is null then
    raise exception 'p_order_id is required' using errcode = '22023';
  end if;
  -- p_session_id is null when Stripe Session creation itself failed and the
  -- server releases its own hold; pass a synthetic p_event_id such as
  -- 'local:<order_id>:session_failed' in that case.
  if p_session_id is not null
     and (length(btrim(p_session_id)) = 0 or length(p_session_id) > 200) then
    raise exception 'p_session_id is invalid' using errcode = '22023';
  end if;
  if p_final_status is null or p_final_status not in ('canceled', 'expired') then
    raise exception 'p_final_status must be canceled or expired' using errcode = '22023';
  end if;

  insert into public.shop_webhook_events (event_id, order_id, event_type)
  values (p_event_id, p_order_id, 'checkout.session.' || p_final_status)
  on conflict (event_id) do nothing
  returning event_id into v_inserted;

  if v_inserted is null then
    select o.status into v_status
      from public.shop_webhook_events e
      join public.shop_orders o on o.id = e.order_id
     where e.event_id = p_event_id;
    return coalesce(v_status, 'unknown');
  end if;

  select o.status, o.stripe_session_id into v_status, v_session
    from public.shop_orders o
   where o.id = p_order_id
   for update;

  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  if v_session is null then
    v_session := p_session_id;
  elsif p_session_id is not null and v_session <> p_session_id then
    raise exception 'session mismatch for order %', p_order_id using errcode = '22023';
  end if;

  update public.shop_orders
     set stripe_session_id = v_session, updated_at = now()
   where id = p_order_id;

  -- Never release paid stock; expiry must not override paid.
  if v_status = 'paid' then
    return 'paid';
  end if;
  if v_status = 'canceled' or v_status = 'expired' then
    return v_status;
  end if;
  if v_status = 'payment_review' then
    return 'payment_review';
  end if;

  select r.id, r.sku, r.quantity
    into v_res_id, v_res_sku, v_res_qty
    from public.shop_reservations r
   where r.order_id = p_order_id and r.status = 'active'
   order by r.id
   limit 1
   for update;

  if found then
    update public.shop_reservations set status = 'released', updated_at = now()
     where id = v_res_id;
    update public.shop_inventory set reserved = reserved - v_res_qty, updated_at = now()
     where sku = v_res_sku;
  end if;

  update public.shop_orders set status = p_final_status, updated_at = now()
   where id = p_order_id;

  return p_final_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: expire stale holds (cron)
-- ---------------------------------------------------------------------------

create or replace function public.shop_expire_holds()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rec record;
  v_released integer := 0;
begin
  -- Lock the parent order first (same order as mark_paid/release_order) and
  -- skip rows another transaction is already handling, so a concurrent payment
  -- webhook always wins the race for its own order.
  for v_rec in
    select r.id, r.order_id, r.sku, r.quantity, o.status as order_status
      from public.shop_reservations r
      join public.shop_orders o on o.id = r.order_id
     where r.status = 'active'
       and r.expires_at <= now()
     order by r.id
     for update of o skip locked
  loop
    update public.shop_reservations
       set status = 'released', updated_at = now()
     where id = v_rec.id
       and status = 'active';
    if not found then
      continue;
    end if;

    update public.shop_inventory
       set reserved = reserved - v_rec.quantity, updated_at = now()
     where sku = v_rec.sku;

    if v_rec.order_status = 'pending' then
      update public.shop_orders
         set status = 'expired', updated_at = now()
       where id = v_rec.order_id
         and status = 'pending';
    end if;

    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: operator stock adjustment (opening count, corrections)
-- ---------------------------------------------------------------------------

create or replace function public.shop_adjust_stock(
  p_sku text,
  p_delta integer,
  p_reason text,
  p_note text default null
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_on_hand integer;
begin
  if p_sku is null or length(btrim(p_sku)) = 0 or length(p_sku) > 200 then
    raise exception 'p_sku is required' using errcode = '22023';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 100000 then
    raise exception 'p_delta must be a non-zero count' using errcode = '22023';
  end if;
  if p_reason is null or p_reason not in ('opening', 'adjustment') then
    raise exception 'p_reason must be opening or adjustment' using errcode = '22023';
  end if;
  if p_note is not null and length(p_note) > 500 then
    raise exception 'p_note is too long' using errcode = '22023';
  end if;

  -- A new SKU starts at zero and is unsellable until counted stock is entered.
  insert into public.shop_inventory (sku) values (p_sku)
  on conflict (sku) do nothing;

  -- Never drop below what is currently held for pending checkouts.
  update public.shop_inventory
     set on_hand = on_hand + p_delta, updated_at = now()
   where sku = p_sku
     and on_hand + p_delta >= reserved
  returning on_hand into v_on_hand;

  if not found then
    raise exception 'adjustment would leave sku % below its reserved units', p_sku
      using errcode = 'P0001';
  end if;

  insert into public.shop_stock_ledger (sku, delta, reason, note)
  values (p_sku, p_delta, p_reason, p_note);

  return v_on_hand;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lock down: RLS on, no anon/authenticated policies, service_role only
-- ---------------------------------------------------------------------------

alter table public.shop_inventory      enable row level security;
alter table public.shop_orders         enable row level security;
alter table public.shop_order_items    enable row level security;
alter table public.shop_reservations   enable row level security;
alter table public.shop_webhook_events enable row level security;
alter table public.shop_stock_ledger   enable row level security;

-- No policies for anon/authenticated: RLS default-denies them. service_role
-- bypasses RLS on Supabase and is the only role granted table privileges.
revoke all on table public.shop_inventory      from public, anon, authenticated;
revoke all on table public.shop_orders         from public, anon, authenticated;
revoke all on table public.shop_order_items    from public, anon, authenticated;
revoke all on table public.shop_reservations   from public, anon, authenticated;
revoke all on table public.shop_webhook_events from public, anon, authenticated;
revoke all on table public.shop_stock_ledger   from public, anon, authenticated;

-- Supabase default privileges hand service_role ALL on new tables; narrow it so
-- snapshots, events and the ledger stay append-only even for the server key.
revoke all on table public.shop_inventory, public.shop_orders, public.shop_order_items,
  public.shop_reservations, public.shop_webhook_events, public.shop_stock_ledger
  from service_role;

grant select, insert          on table public.shop_stock_ledger   to service_role;
grant select, insert, update on table public.shop_inventory      to service_role;
grant select, insert, update on table public.shop_orders         to service_role;
grant select, insert          on table public.shop_order_items   to service_role;
grant select, insert, update on table public.shop_reservations   to service_role;
grant select, insert          on table public.shop_webhook_events to service_role;

revoke all on function public.shop_reserve_order(uuid, text, text, integer, integer, timestamptz)
  from public, anon, authenticated;
revoke all on function public.shop_attach_session(uuid, text)
  from public, anon, authenticated;
revoke all on function public.shop_mark_paid(text, uuid, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.shop_release_order(text, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.shop_expire_holds()
  from public, anon, authenticated;
revoke all on function public.shop_adjust_stock(text, integer, text, text)
  from public, anon, authenticated;

grant execute on function public.shop_reserve_order(uuid, text, text, integer, integer, timestamptz)
  to service_role;
grant execute on function public.shop_attach_session(uuid, text)
  to service_role;
grant execute on function public.shop_mark_paid(text, uuid, text, text, integer, text)
  to service_role;
grant execute on function public.shop_release_order(text, uuid, text, text)
  to service_role;
grant execute on function public.shop_expire_holds()
  to service_role;
grant execute on function public.shop_adjust_stock(text, integer, text, text)
  to service_role;
