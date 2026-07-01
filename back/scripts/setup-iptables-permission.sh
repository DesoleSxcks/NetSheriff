#!/usr/bin/env bash
set -euo pipefail

if [[ "$OSTYPE" != linux* ]]; then
  echo "Auditoria de iptables disponível apenas em ambientes Linux."
  exit 1
fi

if [[ $(id -u) -ne 0 ]]; then
  echo "Este script precisa ser executado com sudo ou como root."
  echo "Exemplo: sudo bash scripts/setup-iptables-permission.sh"
  exit 1
fi

REAL_USER="${SUDO_USER:-${USER:-}}"
if [[ -z "$REAL_USER" ]]; then
  echo "Não foi possível identificar o usuário que chamou o sudo."
  exit 1
fi

IPTABLES_SAVE_BIN="$(command -v iptables-save || true)"
IPTABLES_BIN="$(command -v iptables || true)"

if [[ -z "$IPTABLES_SAVE_BIN" || -z "$IPTABLES_BIN" ]]; then
  echo "iptables não encontrado neste sistema. Instale o pacote iptables e tente novamente."
  exit 1
fi

SUDOERS_FILE="/etc/sudoers.d/netsheriff-iptables"
cat > "$SUDOERS_FILE" <<EOF
$REAL_USER ALL=(root) NOPASSWD: $IPTABLES_SAVE_BIN, $IPTABLES_BIN -L -n -v
EOF

chmod 440 "$SUDOERS_FILE"

if ! visudo -cf "$SUDOERS_FILE" >/dev/null 2>&1; then
  echo "Erro ao validar o sudoers. Verifique o arquivo e tente novamente."
  rm -f "$SUDOERS_FILE"
  exit 1
fi

if ! sudo -n "$IPTABLES_SAVE_BIN" >/dev/null 2>&1; then
  echo "A configuração foi criada, mas o teste final falhou."
  echo "Verifique se o usuário pode executar o comando de leitura do iptables sem senha."
  exit 1
fi

echo "Permissão configurada. Agora rode o backend normalmente com npm start."
