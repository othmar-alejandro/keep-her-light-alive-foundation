#!/bin/sh
# Runs the shop migration, its SQL tests and the last-unit race against a
# throwaway local Postgres. Never touches the remote Supabase project.
#   sh supabase/tests/run_local.sh
set -eu

here=$(cd "$(dirname "$0")/.." && pwd)
port=${PGPORT_TEST:-55432}
data=$(mktemp -d /tmp/khla-pg.XXXXXX)
trap 'pg_ctl -D "$data" -m immediate stop >/dev/null 2>&1; rm -rf "$data"' EXIT

initdb -D "$data" -U postgres -A trust >/dev/null
pg_ctl -D "$data" -o "-p $port -c listen_addresses=127.0.0.1 -c unix_socket_directories=''" \
  -l "$data/log" -w start >/dev/null

q() { psql -h 127.0.0.1 -p "$port" -U postgres -d postgres -v ON_ERROR_STOP=1 -qAt "$@"; }

# Mirror Supabase: the three API roles, plus the default privileges that hand
# every new public table and function to all of them.
q -c "create role anon nologin; create role authenticated nologin;
      create role service_role nologin bypassrls;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;"

for f in "$here"/migrations/*.sql; do q -f "$f"; done
q -f "$here/tests/shop_core.sql"

# Last-unit race: 20 simultaneous buyers per round, 1 unit, exactly one winner.
rounds=10
buyers=20
r=1
while [ "$r" -le "$rounds" ]; do
  sku="RACE-$r"
  q -c "select public.shop_adjust_stock('$sku', 1, 'opening')" >/dev/null
  b=1
  while [ "$b" -le "$buyers" ]; do
    q -c "set role service_role; select public.shop_reserve_order(gen_random_uuid(), '$sku', 'Race', 1, 100, now() + interval '30 minutes')" \
      >/dev/null 2>&1 &
    b=$((b + 1))
  done
  wait
  won=$(q -c "select count(*) from public.shop_reservations where sku = '$sku' and status = 'active'")
  inv=$(q -c "select on_hand || '/' || reserved from public.shop_inventory where sku = '$sku'")
  if [ "$won" != 1 ] || [ "$inv" != "1/1" ]; then
    echo "race FAILED round $r: winners=$won on_hand/reserved=$inv"
    exit 1
  fi
  r=$((r + 1))
done
orphans=$(q -c "select count(*) from public.shop_orders o where not exists (select 1 from public.shop_reservations r where r.order_id = o.id)")
[ "$orphans" = 0 ] || { echo "race FAILED: $orphans orders without a hold"; exit 1; }
echo "last-unit race passed: $rounds rounds x $buyers buyers, one winner each"
