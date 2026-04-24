#!/usr/bin/env bash
set -euo pipefail

APP_NAME="bloodnet"
APP_DIR="/var/www/bloodnet"
ECOSYSTEM_FILE="${APP_DIR}/ecosystem.config.cjs"
ENV_FILE="${APP_DIR}/.env"

echo "==> BloodNet production deploy started"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Create it first from .env.example"
  exit 1
fi

cd "${APP_DIR}"

echo "==> Fetch latest code"
git fetch origin
git reset --hard origin/main

echo "==> Install dependencies"
npm ci

echo "==> Prisma generate + migrate deploy"
npx prisma generate
npx prisma migrate deploy

echo "==> Build Next.js app"
npm run build

echo "==> Ensure log directory"
mkdir -p /var/www/bloodnet/logs

echo "==> Restart app with PM2"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${ECOSYSTEM_FILE}" --only "${APP_NAME}" --update-env
else
  pm2 start "${ECOSYSTEM_FILE}" --only "${APP_NAME}" --update-env
fi

echo "==> Save PM2 process list"
pm2 save

echo "==> Deploy done"
pm2 status "${APP_NAME}"
