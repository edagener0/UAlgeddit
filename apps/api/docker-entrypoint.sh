#!/bin/sh
# Applies pending database migrations, then starts the given command.
set -eu

echo "Applying database migrations..."
/app/node_modules/.bin/prisma migrate deploy

exec "$@"
