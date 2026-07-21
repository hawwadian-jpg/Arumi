#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/connection.sh"

require_command npm
require_command tar
require_command curl
prepare_connection
prepare_privilege

release_id="$(date -u +%Y%m%d%H%M%S)"
archive_name="seeonline-${release_id}.tar.gz"
temporary_directory="$(mktemp -d)"

cleanup() {
  rm -rf "${temporary_directory}"
  unset SSHPASS || true
}
trap cleanup EXIT

log "Проверяю и собираю production-версию."
cd "${PROJECT_ROOT}"
SITE_URL="https://${DOMAIN}" npm run build

COPYFILE_DISABLE=1 tar --no-xattrs -C "${PROJECT_ROOT}/dist" -czf "${temporary_directory}/${archive_name}" .
log "Передаю архив на сервер."
"${SCP_COMMAND[@]}" "${temporary_directory}/${archive_name}" "${SERVER_USER}@${SERVER_HOST}:/tmp/${archive_name}"
"${SCP_COMMAND[@]}" "${PROJECT_ROOT}/server/subscription-server.mjs" "${SERVER_USER}@${SERVER_HOST}:/tmp/seeonline-subscription-server.mjs"

log "Переключаю релиз атомарно."
remote_exec_privileged bash -s -- "${REMOTE_ROOT}" "${release_id}" "/tmp/${archive_name}" "/tmp/seeonline-subscription-server.mjs" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

remote_root="$1"
release_id="$2"
archive_path="$3"
backend_path="$4"
release_path="${remote_root}/releases/${release_id}"

mkdir -p "${release_path}"
tar -xzf "${archive_path}" -C "${release_path}"
rm -f "${archive_path}"
chown -R www-data:www-data "${release_path}"

if [[ -f "${backend_path}" ]]; then
  install -d -m 755 /opt/seeonline
  install -m 644 "${backend_path}" /opt/seeonline/subscription-server.mjs
  rm -f "${backend_path}"
  systemctl restart seeonline-subscriptions.service
fi

ln -sfn "${release_path}" "${remote_root}/current.next"
mv -Tf "${remote_root}/current.next" "${remote_root}/current"

nginx -t
systemctl reload nginx

# Хранятся пять последних релизов. Удаление ограничено проверенным releases-каталогом.
mapfile -t old_releases < <(find "${remote_root}/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | tail -n +6 | cut -d' ' -f2-)
for old_release in "${old_releases[@]}"; do
  [[ "${old_release}" == "${remote_root}/releases/"* ]] && rm -rf -- "${old_release}"
done
REMOTE_SCRIPT

log "Проверяю опубликованный сайт."
for attempt in 1 2 3 4 5; do
  if curl --fail --silent --show-error --max-time 15 "https://${DOMAIN}/" >/dev/null; then
    log "Готово: https://${DOMAIN} (релиз ${release_id})."
    exit 0
  fi
  [[ "${attempt}" -lt 5 ]] && sleep 3
done

die "Релиз загружен, но HTTPS health-check не прошёл. Выполните make rollback."
