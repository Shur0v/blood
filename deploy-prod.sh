#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export BLOODNET_APP_DIR="${BLOODNET_APP_DIR:-${DEPLOY_ROOT}}"
cd "${BLOODNET_APP_DIR}"

# Fetch the implementation before starting it. A running shell otherwise keeps
# executing the old deployment steps even after git reset replaces its file.
git fetch origin main
DEPLOY_SCRIPT="$(mktemp)"
trap 'rm -f -- "${DEPLOY_SCRIPT}"' EXIT
git show origin/main:deploy/deploy.sh > "${DEPLOY_SCRIPT}"
bash "${DEPLOY_SCRIPT}"
