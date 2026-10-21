#!/bin/sh
# Drives the checkout, webhook and order-status routes against a throwaway
# Postgres + PostgREST. No Stripe account or remote project is touched: webhook
# events are signed locally, and Session creation is expected to fail on the
# fake key, which exercises the hold-release path.
#   POSTGREST_BIN=/path/to/postgrest sh shop/tests/payment-flow.sh
# The app runs from a temp copy so a dev server using shop/.next is unaffected.
set -eu

: "${POSTGREST_BIN:?set POSTGREST_BIN to a postgrest binary (github.com/PostgREST/postgrest/releases)}"
shop=$(cd "$(dirname "$0")/.." && pwd)
work=$(mktemp -d /tmp/khla-flow.XXXXXX)
trap 'kill $(jobs -p) 2>/dev/null || true; pg_ctl -D "$work/pg" -m immediate stop >/dev/null 2>&1; rm -rf "$work"' EXIT

initdb -D "$work/pg" -U postgres -A trust >/dev/null
pg_ctl -D "$work/pg" -o "-p 55442 -c listen_addresses=127.0.0.1 -c unix_socket_directories=''" \
  -l "$work/pg.log" -w start >/dev/null
q() { psql -h 127.0.0.1 -p 55442 -U postgres -d postgres -v ON_ERROR_STOP=1 -qAt "$@"; }
q -c "create role anon nologin; create role authenticated nologin;
      create role service_role nologin bypassrls;
      create role authenticator login noinherit;
      grant anon, authenticated, service_role to authenticator;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;"
for f in "$shop"/../supabase/migrations/*.sql; do q -f "$f"; done

PGRST_DB_URI="postgres://authenticator@127.0.0.1:55442/postgres" PGRST_DB_SCHEMAS=public \
PGRST_DB_ANON_ROLE=anon PGRST_JWT_SECRET="local-test-secret-local-test-secret-0000" \
PGRST_SERVER_PORT=55443 "$POSTGREST_BIN" >"$work/postgrest.log" 2>&1 &

mkdir "$work/app"
cp -R "$shop/src" "$shop/public" "$shop"/*.ts "$shop"/*.mjs "$shop"/*.json "$work/app/"
ln -s "$shop/node_modules" "$work/app/node_modules"

APP_DIR="$work/app" node "$shop/tests/payment-flow.mjs"
