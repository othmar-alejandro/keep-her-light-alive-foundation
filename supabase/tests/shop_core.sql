-- KHLA Shop core validation tests.
--
-- Local harness (mirrors Supabase roles); see supabase/tests/run_local.sh.
-- The script runs as a superuser (so it can SET ROLE), exercises the RPCs as
-- service_role, checks anon/authenticated are denied, and rolls everything
-- back. Do NOT run against a remote project.

begin;

set local role service_role;

-- 0. Opening stock goes through the ledgered RPC; a new SKU starts at zero.
do $$
begin
  assert public.shop_adjust_stock('KHLA-TEST-A', 1, 'opening') = 1, 'opening stock A';
  assert public.shop_adjust_stock('KHLA-TEST-B', 5, 'opening') = 5, 'opening stock B';
  assert public.shop_adjust_stock('KHLA-TEST-C', 1, 'opening') = 1, 'opening stock C';
  assert public.shop_adjust_stock('KHLA-TEST-D', 2, 'opening') = 2, 'opening stock D';
  assert public.shop_adjust_stock('KHLA-TEST-E', 1, 'opening') = 1, 'opening stock E';
  begin
    perform public.shop_adjust_stock('KHLA-TEST-A', 1, 'sale');
    raise exception 'expected reason rejection';
  exception when others then
    if sqlerrm not like '%p_reason%' then raise; end if;
  end;
end $$;

-- 1. Reserve the last unit.
do $$
declare r record; v_reserved integer;
begin
  select * into r from public.shop_reserve_order(
    '11111111-1111-1111-1111-111111111111', 'KHLA-TEST-A', 'Tee', 1, 2800,
    now() + interval '30 minutes');
  assert r.order_id = '11111111-1111-1111-1111-111111111111', 'reserve returns order id';
  assert r.lookup_token is not null, 'reserve returns lookup token';
  assert r.expires_at is not null, 'reserve returns expiry';
  select reserved into v_reserved from public.shop_inventory where sku = 'KHLA-TEST-A';
  assert v_reserved = 1, 'hold is counted in reserved (pending keeps stock out of available)';
end $$;

-- 2. A second last-unit buyer loses (true concurrency: race_last_unit.sh).
do $$
begin
  begin
    perform public.shop_reserve_order(
      '22222222-2222-2222-2222-222222222222', 'KHLA-TEST-A', 'Tee', 1, 2800,
      now() + interval '30 minutes');
    raise exception 'expected insufficient stock';
  exception when others then
    if sqlerrm not like '%insufficient stock%' then raise; end if;
  end;
  assert not exists (select 1 from public.shop_orders
                     where id = '22222222-2222-2222-2222-222222222222'),
    'failed reserve leaves no order row';
  assert (select reserved from public.shop_inventory where sku = 'KHLA-TEST-A') = 1,
    'failed reserve leaves reserved unchanged';
  -- Stock on hand cannot be adjusted below what is held.
  begin
    perform public.shop_adjust_stock('KHLA-TEST-A', -1, 'adjustment');
    raise exception 'expected reserved guard';
  exception when others then
    if sqlerrm not like '%below its reserved units%' then raise; end if;
  end;
end $$;

-- 3. Idempotent retry with the same UUID and content is a no-op.
do $$
declare a record; b record;
begin
  select * into a from public.shop_reserve_order(
    '11111111-1111-1111-1111-111111111111', 'KHLA-TEST-A', 'Tee', 1, 2800,
    now() + interval '30 minutes');
  select * into b from public.shop_reserve_order(
    '11111111-1111-1111-1111-111111111111', 'KHLA-TEST-A', 'Tee', 1, 2800,
    now() + interval '31 minutes');
  assert b.lookup_token = a.lookup_token, 'retry returns same lookup token';
  assert b.expires_at = a.expires_at, 'retry keeps original expiry';
  assert (select reserved from public.shop_inventory where sku = 'KHLA-TEST-A') = 1,
    'retry does not double reserve';
end $$;

-- 4. Same UUID with different content is rejected.
do $$
begin
  begin
    perform public.shop_reserve_order(
      '11111111-1111-1111-1111-111111111111', 'KHLA-TEST-A', 'Tee', 2, 2800,
      now() + interval '30 minutes');
    raise exception 'expected idempotency mismatch';
  exception when others then
    if sqlerrm not like '%idempotency mismatch%' then raise; end if;
  end;
end $$;

-- 5. Attach session: replay same session ok, different session rejected.
do $$
begin
  assert public.shop_attach_session(
    '11111111-1111-1111-1111-111111111111', 'cs_test_1') = 'pending',
    'attach returns pending';
  assert public.shop_attach_session(
    '11111111-1111-1111-1111-111111111111', 'cs_test_1') = 'pending',
    'replay of same session is tolerated';
  begin
    perform public.shop_attach_session(
      '11111111-1111-1111-1111-111111111111', 'cs_test_other');
    raise exception 'expected session mismatch';
  exception when others then
    if sqlerrm not like '%different session%' then raise; end if;
  end;
end $$;

-- 6. Mark paid: decrements physical stock once and commits the hold.
do $$
declare v_status text; v_on integer; v_res integer; v_res_status text;
begin
  v_status := public.shop_mark_paid('evt_paid_1',
    '11111111-1111-1111-1111-111111111111', 'cs_test_1', 'pi_test_1', 2800, 'buyer@example.com');
  assert v_status = 'paid', 'mark_paid returns paid';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-A';
  assert v_on = 0, 'on_hand decremented on paid';
  assert v_res = 0, 'reserved released on paid';
  select status into v_res_status from public.shop_reservations
   where order_id = '11111111-1111-1111-1111-111111111111';
  assert v_res_status = 'committed', 'reservation committed on paid';
end $$;

-- 7. Replaying the same event id does not touch stock.
do $$
begin
  assert public.shop_mark_paid('evt_paid_1',
    '11111111-1111-1111-1111-111111111111', 'cs_test_1', 'pi_test_1', 2800, null) = 'paid',
    'event replay returns paid';
  assert (select on_hand from public.shop_inventory where sku = 'KHLA-TEST-A') = 0,
    'event replay does not decrement again';
end $$;

-- 8. A different delivery of an already-paid order stays paid, no stock change.
do $$
begin
  assert public.shop_mark_paid('evt_paid_1b',
    '11111111-1111-1111-1111-111111111111', 'cs_test_1', 'pi_test_1', 2800, null) = 'paid',
    'duplicate paid event stays paid';
  assert (select on_hand from public.shop_inventory where sku = 'KHLA-TEST-A') = 0,
    'duplicate paid event does not decrement';
  assert (select count(*) from public.shop_stock_ledger
          where order_id = '11111111-1111-1111-1111-111111111111') = 1,
    'one sale ledger row per paid order';
end $$;

-- 9. Expiry releases a hold; a late paid event is honoured from available stock.
do $$
declare v_status text; v_on integer; v_res integer;
begin
  perform public.shop_reserve_order(
    '33333333-3333-3333-3333-333333333333', 'KHLA-TEST-B', 'Cap', 2, 1500,
    now() + interval '30 minutes');
  perform public.shop_attach_session(
    '33333333-3333-3333-3333-333333333333', 'cs_test_3');
  update public.shop_reservations set expires_at = now() - interval '1 minute'
   where order_id = '33333333-3333-3333-3333-333333333333' and status = 'active';

  assert public.shop_expire_holds() = 1, 'expire_holds releases one hold';
  assert (select status from public.shop_orders
          where id = '33333333-3333-3333-3333-333333333333') = 'expired',
    'expire_holds marks pending order expired';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-B';
  assert v_on = 5, 'expiry leaves physical stock untouched';
  assert v_res = 0, 'expiry releases reserved units';

  v_status := public.shop_mark_paid('evt_late_3',
    '33333333-3333-3333-3333-333333333333', 'cs_test_3', 'pi_test_3', 3000, null);
  assert v_status = 'paid', 'late paid with stock available is paid';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-B';
  assert v_on = 3 and v_res = 0, 'late paid decrements physical stock once';
end $$;

-- 10. Expiring twice releases nothing more.
do $$
begin
  assert public.shop_expire_holds() = 0, 'second expire_holds pass is a no-op';
end $$;

-- 11. Release frees the hold and is idempotent.
do $$
declare v_res integer;
begin
  perform public.shop_reserve_order(
    '44444444-4444-4444-4444-444444444444', 'KHLA-TEST-C', 'Bag', 1, 1500,
    now() + interval '30 minutes');
  perform public.shop_attach_session(
    '44444444-4444-4444-4444-444444444444', 'cs_test_4');
  assert public.shop_release_order('evt_cancel_4',
    '44444444-4444-4444-4444-444444444444', 'cs_test_4', 'canceled') = 'canceled',
    'release sets canceled';
  select reserved into v_res from public.shop_inventory where sku = 'KHLA-TEST-C';
  assert v_res = 0, 'release frees the hold';
  assert public.shop_release_order('evt_cancel_4',
    '44444444-4444-4444-4444-444444444444', 'cs_test_4', 'canceled') = 'canceled',
    'release replay is idempotent';
end $$;

-- 12. Late paid when another buyer now holds the last unit: flag, no oversell.
do $$
declare v_on integer; v_res integer;
begin
  perform public.shop_reserve_order(
    '77777777-7777-7777-7777-777777777777', 'KHLA-TEST-C', 'Bag', 1, 1500,
    now() + interval '30 minutes');
  assert public.shop_mark_paid('evt_late_4',
    '44444444-4444-4444-4444-444444444444', 'cs_test_4', 'pi_test_4', 1500, null)
    = 'payment_review', 'late paid with stock short flags review';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-C';
  assert v_on = 1 and v_res = 1, 'short late paid leaves the other buyer''s hold intact';
  assert public.shop_mark_paid('evt_late_4b',
    '44444444-4444-4444-4444-444444444444', 'cs_test_4', 'pi_test_4', 1500, null)
    = 'payment_review', 'flagged order stays flagged on a new delivery';
end $$;

-- 13. Release must never touch paid stock.
do $$
begin
  assert public.shop_release_order('evt_cancel_paid',
    '11111111-1111-1111-1111-111111111111', 'cs_test_1', 'canceled') = 'paid',
    'release does not override paid';
  assert (select on_hand from public.shop_inventory where sku = 'KHLA-TEST-A') = 0,
    'paid stock untouched by release';
end $$;

-- 14. Underpayment is flagged and the hold is released, not fulfilled.
do $$
declare v_status text; v_res integer; v_on integer;
begin
  perform public.shop_reserve_order(
    '55555555-5555-5555-5555-555555555555', 'KHLA-TEST-D', 'Cup', 1, 1500,
    now() + interval '30 minutes');
  perform public.shop_attach_session(
    '55555555-5555-5555-5555-555555555555', 'cs_test_5');
  v_status := public.shop_mark_paid('evt_under_5',
    '55555555-5555-5555-5555-555555555555', 'cs_test_5', 'pi_test_5', 1000, null);
  assert v_status = 'payment_review', 'underpaid order is flagged';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-D';
  assert v_on = 2, 'underpaid does not decrement physical stock';
  assert v_res = 0, 'underpaid releases the hold';
end $$;

-- 15. Paid arrives after the hold's expiry time but before any sweep: commit.
do $$
declare v_on integer; v_res integer;
begin
  perform public.shop_reserve_order(
    '88888888-8888-8888-8888-888888888888', 'KHLA-TEST-D', 'Cup', 2, 1500,
    now() + interval '30 minutes');
  update public.shop_reservations set expires_at = now() - interval '1 minute'
   where order_id = '88888888-8888-8888-8888-888888888888';
  -- Session was never attached; the webhook binds it.
  assert public.shop_mark_paid('evt_paid_8',
    '88888888-8888-8888-8888-888888888888', 'cs_test_8', 'pi_test_8', 3000, null) = 'paid',
    'still-held stock is committed even past expiry time';
  select on_hand, reserved into v_on, v_res from public.shop_inventory where sku = 'KHLA-TEST-D';
  assert v_on = 0 and v_res = 0, 'past-expiry commit decrements once';
  assert public.shop_expire_holds() = 0, 'sweep finds nothing after commit';
end $$;

-- 16. Server-side release when Stripe Session creation failed (no session id).
do $$
begin
  perform public.shop_reserve_order(
    '99999999-9999-9999-9999-999999999999', 'KHLA-TEST-E', 'Pouch', 1, 1200,
    now() + interval '30 minutes');
  assert public.shop_release_order('local:99999999:session_failed',
    '99999999-9999-9999-9999-999999999999', null, 'canceled') = 'canceled',
    'release without a session id';
  assert (select reserved from public.shop_inventory where sku = 'KHLA-TEST-E') = 0,
    'sessionless release frees the hold';
end $$;

-- 17. Invariants: ledger reconciles to on_hand; reserved equals active holds.
do $$
begin
  assert not exists (
    select 1 from public.shop_inventory i
     where i.on_hand <> (select coalesce(sum(l.delta), 0)
                           from public.shop_stock_ledger l where l.sku = i.sku)),
    'sum(ledger.delta) = on_hand for every sku';
  assert not exists (
    select 1 from public.shop_inventory i
     where i.reserved <> (select coalesce(sum(r.quantity), 0)
                            from public.shop_reservations r
                           where r.sku = i.sku and r.status = 'active')),
    'reserved = sum(active holds) for every sku';
end $$;

-- 18. service_role itself cannot rewrite history.
do $$
begin
  begin
    delete from public.shop_orders;
    raise exception 'service_role should not delete orders';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.shop_stock_ledger set delta = 99;
    raise exception 'service_role should not edit the ledger';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.shop_order_items set unit_amount = 1;
    raise exception 'service_role should not edit price snapshots';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 19. anon and authenticated cannot execute any RPC or touch any table.
reset role;
do $$
declare v_role text; v_tbl text; v_fn text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    foreach v_tbl in array array['shop_inventory', 'shop_orders', 'shop_order_items',
        'shop_reservations', 'shop_webhook_events', 'shop_stock_ledger'] loop
      assert not has_table_privilege(v_role, 'public.' || v_tbl,
        'select, insert, update, delete, truncate'),
        v_role || ' has a privilege on ' || v_tbl;
      assert (select relrowsecurity from pg_class
               where oid = ('public.' || v_tbl)::regclass), v_tbl || ' has RLS off';
    end loop;
    for v_fn in
      select p.oid::regprocedure::text from pg_proc p
       where p.pronamespace = 'public'::regnamespace and p.proname like 'shop\_%'
    loop
      assert not has_function_privilege(v_role, v_fn, 'execute'),
        v_role || ' can execute ' || v_fn;
    end loop;
  end loop;
  assert (select count(*) from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.proname like 'shop\_%') = 6,
    'six shop RPCs exist';
end $$;

set local role anon;
do $$
begin
  begin
    perform public.shop_reserve_order(
      '66666666-6666-6666-6666-666666666666', 'KHLA-TEST-B', 'Cap', 1, 1500,
      now() + interval '30 minutes');
    raise exception 'anon should not execute shop_reserve_order';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.shop_orders;
    raise exception 'anon should not read shop_orders';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;

select 'shop_core tests passed' as result;
