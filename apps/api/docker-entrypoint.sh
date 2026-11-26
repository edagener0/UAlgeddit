#!/bin/sh
# Applies pending database migrations, then starts the given command.
set -eu

echo "Applying database migrations..."
npx prisma migrate deploy

exec "$@"
