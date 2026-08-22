#!/usr/bin/env bash
# Niu-LKH pre-deploy health check.
# Defensive: fail fast on unset vars, pipeline failures, and trap errors.
set -Eeuo pipefail
IFS=$'\n\t'

log()  { printf '[check] %s\n' "$*"; }
fail() { printf '[check] ERROR: %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "node is required"
command -v npm  >/dev/null 2>&1 || fail "npm is required"

log "node $(node -v)"
log "npm $(npm -v)"

# 1. Install / verify dependencies
if [[ ! -d node_modules ]]; then
  log "installing dependencies..."
  npm install
else
  log "dependencies present"
fi

# 2. Type check
log "running typecheck..."
npm run typecheck

# 3. Unit tests
log "running unit tests..."
npm test

# 4. Production build
log "running production build..."
npm run build

log "all checks passed."
