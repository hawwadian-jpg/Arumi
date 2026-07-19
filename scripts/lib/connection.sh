#!/usr/bin/env bash

# Общие функции подключения. Файл подключается через source из deploy-скриптов
# и сам по себе не запускается.

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "${PROJECT_ROOT}/deploy.env" ]]; then
  # deploy.env является локальным конфигом и не должен содержать shell-команды.
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/deploy.env"
fi

DOMAIN="${DOMAIN:-seeonline.ru}"
SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/${DOMAIN}}"

log() {
  printf '\033[1;34m[deploy]\033[0m %s\n' "$*"
}

die() {
  printf '\033[1;31m[ошибка]\033[0m %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Не найдена команда '$1'. ${2:-Установите её и повторите запуск.}"
}

validate_settings() {
  [[ -n "${SERVER_HOST}" ]] || die "Укажите SERVER_HOST в deploy.env или в переменной окружения."
  [[ "${DOMAIN}" =~ ^[a-zA-Z0-9.-]+$ ]] || die "DOMAIN содержит недопустимые символы."
  [[ "${SERVER_HOST}" =~ ^[a-zA-Z0-9.:-]+$ ]] || die "SERVER_HOST содержит недопустимые символы."
  [[ "${SERVER_USER}" =~ ^[a-zA-Z0-9._-]+$ ]] || die "SERVER_USER содержит недопустимые символы."
  [[ "${SSH_PORT}" =~ ^[0-9]+$ ]] || die "SSH_PORT должен быть числом."
  [[ "${REMOTE_ROOT}" == /var/www/* ]] || die "REMOTE_ROOT должен находиться внутри /var/www."
}

SSH_BASE=(
  -p "${SSH_PORT}"
  -o ConnectTimeout=10
  -o ServerAliveInterval=15
  -o ServerAliveCountMax=3
  -o StrictHostKeyChecking=accept-new
)

SCP_BASE=(
  -P "${SSH_PORT}"
  -o ConnectTimeout=10
  -o StrictHostKeyChecking=accept-new
)

# Сначала проверяется обычный SSH-ключ. Пароль запрашивается только если ключ
# не сработал; sshpass получает пароль через окружение, а не через аргументы.
prepare_connection() {
  validate_settings
  require_command ssh
  require_command scp

  if ssh "${SSH_BASE[@]}" -o BatchMode=yes "${SERVER_USER}@${SERVER_HOST}" true 2>/dev/null; then
    SSH_COMMAND=(ssh "${SSH_BASE[@]}")
    SCP_COMMAND=(scp "${SCP_BASE[@]}")
    log "Подключение по SSH-ключу подтверждено."
    return
  fi

  require_command sshpass "Для парольного fallback установите sshpass или настройте SSH-ключ."
  if [[ -z "${SSHPASS:-}" ]]; then
    read -r -s -p "Пароль SSH для ${SERVER_USER}@${SERVER_HOST}: " SSHPASS
    printf '\n'
    export SSHPASS
  fi

  SSH_COMMAND=(sshpass -e ssh "${SSH_BASE[@]}")
  SCP_COMMAND=(sshpass -e scp "${SCP_BASE[@]}")
  "${SSH_COMMAND[@]}" "${SERVER_USER}@${SERVER_HOST}" true \
    || die "Не удалось подключиться ни по ключу, ни по паролю."
  log "Подключение по паролю подтверждено. Рекомендуется настроить SSH-ключ."
}

remote_exec() {
  "${SSH_COMMAND[@]}" "${SERVER_USER}@${SERVER_HOST}" "$@"
}

remote_copy() {
  "${SCP_COMMAND[@]}" "$@" "${SERVER_USER}@${SERVER_HOST}:"
}

# Системные операции выполняются напрямую под root либо через passwordless sudo.
# Пароль sudo намеренно не передаётся автоматически и не попадает в процессы/логи.
prepare_privilege() {
  if [[ "$(remote_exec id -u)" == "0" ]]; then
    REMOTE_PRIVILEGE=()
  elif remote_exec sudo -n true 2>/dev/null; then
    REMOTE_PRIVILEGE=(sudo -n)
  else
    die "Для деплоя нужен root или пользователь с passwordless sudo."
  fi
}
