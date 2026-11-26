#!/usr/bin/env sh
# Creates the .env files from their examples, with freshly generated secrets.
# Existing files are never overwritten. Used by `make env`.
set -eu

cd "$(dirname "$0")/.."

random() {
  # URL-safe random string (no characters that need escaping in a connection URL).
  openssl rand -base64 48 | tr -d '\n/+='
}

# Read a variable from an existing env file (empty when missing).
read_var() {
  [ -f "$1" ] && sed -n "s/^$2=//p" "$1" | tail -n 1 || true
}

db_password="$(read_var .env POSTGRES_PASSWORD)"
[ -n "$db_password" ] || db_password="$(random | cut -c1-32)"

if [ ! -f .env ]; then
  sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$(random)|" \
      -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${db_password}|" \
      .env.example > .env
  chmod 600 .env
  echo "Created .env (random JWT secret and database password)"
fi

if [ ! -f apps/api/.env ]; then
  db_user="$(read_var .env POSTGRES_USER)"
  db_name="$(read_var .env POSTGRES_DB)"
  db_port="$(read_var .env POSTGRES_PORT)"
  sed -e "s|^JWT_SECRET=.*|JWT_SECRET=$(random)|" \
      -e "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://${db_user:-ualgeddit}:${db_password}@localhost:${db_port:-5432}/${db_name:-ualgeddit}?schema=public|" \
      apps/api/.env.example > apps/api/.env
  chmod 600 apps/api/.env
  echo "Created apps/api/.env"
fi
