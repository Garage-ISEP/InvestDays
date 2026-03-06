#!/bin/sh
set -e

required_vars="DATABASE_URL JWT_SECRET FINAGE_API_KEY SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS"
for var in $required_vars; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "FATAL: Missing required environment variable: $var"
    exit 1
  fi
done

echo "⏳ Waiting for database..."
until echo "SELECT 1" | node ./node_modules/prisma/build/index.js db execute --stdin > /dev/null 2>&1; do
  echo "  DB not ready, retrying in 2s..."
  sleep 2
done

echo "🔄 Running migrations..."
./node_modules/.bin/prisma migrate deploy

echo "🚀 Starting Next.js..."
exec node server.js