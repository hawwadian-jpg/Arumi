#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/connection.sh"

validate_settings
require_command ssh-keyscan
require_command ssh-keygen

temporary_key="$(mktemp)"
trap 'rm -f "${temporary_key}"' EXIT

log "Получаю публичный host key ${SERVER_HOST}:${SSH_PORT}."
ssh-keyscan -T 10 -p "${SSH_PORT}" "${SERVER_HOST}" 2>/dev/null > "${temporary_key}"
[[ -s "${temporary_key}" ]] || die "Сервер не ответил на SSH-порту ${SSH_PORT}."

printf 'Сверьте fingerprint с панелью провайдера сервера:\n\n'
ssh-keygen -lf "${temporary_key}"
printf '\nСкрипт ничего не изменил в ~/.ssh/known_hosts.\n'
