#!/usr/bin/env bash
set -euo pipefail

APP_NAME="bloodnet"
export NODE_ENV=production
APP_DIR="${BLOODNET_APP_DIR:-/var/www/bloodnet}"
ECOSYSTEM_FILE="${APP_DIR}/ecosystem.config.cjs"
ENV_FILE="${APP_DIR}/.env"

echo "==> BloodNet production deploy started"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Create it first from .env.example"
  exit 1
fi

cd "${APP_DIR}"

for tool in git node npm pm2 curl pg_dump pg_restore tar; do
  if ! command -v "${tool}" >/dev/null 2>&1; then
    echo "ERROR: Required deployment tool ${tool} is missing; existing services were not stopped." >&2
    exit 1
  fi
done
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if (!(major >= 24 || major === 22 && minor >= 12 || major === 20 && minor >= 19)) { console.error("ERROR: Prisma requires Node 20.19+, 22.12+, or 24+."); process.exit(1); }'

echo "==> Ensure core services are running"
if command -v systemctl >/dev/null 2>&1; then
  systemctl is-active --quiet nginx || systemctl restart nginx
  systemctl is-active --quiet postgresql || systemctl restart postgresql
fi

# Never replace .next or node_modules underneath running HTTP/queue processes.
# Pause other VPS replicas and scheduled writers in the same maintenance window.
deployment_failed() {
  pm2 stop bloodnet bloodnet-prescriptions >/dev/null 2>&1 || true
  echo "ERROR: Deployment stopped. Keep traffic paused; inspect the failed step and the backup before restarting. Do not reset the database or roll back to code that cannot write the new schema." >&2
}
trap deployment_failed ERR
echo "==> Pause application and email queue before replacing runtime files"
for process in bloodnet bloodnet-prescriptions; do
  if pm2 describe "${process}" >/dev/null 2>&1; then
    pm2 stop "${process}"
  fi
done

if [[ -d "${APP_DIR}/public/uploads" ]]; then
  echo "==> Preserve local uploaded media before replacing code"
  (umask 077; mkdir -p /var/backups/bloodnet; tar -czf "/var/backups/bloodnet/uploads-$(date -u +%Y%m%dT%H%M%SZ).tar.gz" -C "${APP_DIR}/public" uploads)
fi

echo "==> Fetch latest code"
git fetch origin
git reset --hard origin/main

echo "==> Install dependencies"
# Prisma migration/build tooling and the supervised tsx worker are required on VPS.
npm ci --include=dev

echo "==> Ensure private medical storage is configured safely"
npm run medical:configure

echo "==> Validate production configuration and database access"
npm run deploy:check -- --database --existing --smtp

echo "==> Back up existing data"
npm run db:backup -- /var/backups/bloodnet

echo "==> Build before changing the database"
npm run build

echo "==> Apply additive database migrations"
npx prisma migrate deploy

echo "==> Validate schema and existing user IDs"
npm run deploy:check -- --schema

echo "==> Ensure log directory"
mkdir -p "${APP_DIR}/logs"

echo "==> Restart app with PM2"
# Recreate stopped entries so stale PM2 DATABASE_URL/secrets cannot override .env.
for process in bloodnet bloodnet-prescriptions; do
  if pm2 describe "${process}" >/dev/null 2>&1; then
    pm2 delete "${process}"
  fi
done
pm2 start "${ECOSYSTEM_FILE}" --update-env

echo "==> Verify running application health"
curl --fail --silent --show-error --retry 10 --retry-connrefused --retry-delay 2 --connect-timeout 3 --max-time 5 http://127.0.0.1:3000/api/health >/dev/null

echo "==> Save PM2 process list"
pm2 save

echo "==> Deploy done"
pm2 status "${APP_NAME}"
