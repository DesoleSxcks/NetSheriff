#!/usr/bin/env bash
set -euo pipefail

if [[ "$OSTYPE" != linux* ]]; then
  echo "Auditoria de iptables disponível apenas em ambientes Linux."
  exit 1
fi

IPTABLES_SAVE_BIN="$(command -v iptables-save || true)"

if [[ -z "$IPTABLES_SAVE_BIN" ]]; then
  echo "iptables não encontrado neste sistema."
  exit 1
fi

if sudo -n "$IPTABLES_SAVE_BIN" >/dev/null 2>&1; then
  echo "Auditoria de iptables configurada corretamente."
else
  echo "Permissão ainda não configurada. Execute npm run setup:iptables."
  exit 1
fi
