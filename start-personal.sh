#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PERSONAL_MODE="${PERSONAL_MODE:-true}"
export PERSONAL_EMAIL="${PERSONAL_EMAIL:-admin@flowpilot.local}"
export PERSONAL_PASSWORD="${PERSONAL_PASSWORD:-FlowPilotPersonal123!}"
export PERSONAL_NAME="${PERSONAL_NAME:-Administrador}"
export PERSONAL_WORKSPACE_NAME="${PERSONAL_WORKSPACE_NAME:-Meu Instagram}"
exec node server.js
