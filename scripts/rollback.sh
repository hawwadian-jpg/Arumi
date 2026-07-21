#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/connection.sh"

prepare_connection
prepare_privilege
log "Переключаю сайт на предыдущий релиз."

remote_exec_privileged bash -s -- "${REMOTE_ROOT}" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

remote_root="$1"
current_target="$(readlink -f "${remote_root}/current")"
mapfile -t releases < <(find "${remote_root}/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)

previous=""
for release in "${releases[@]}"; do
  if [[ "${release}" != "${current_target}" && "$(basename "${release}")" != "bootstrap" ]]; then
    previous="${release}"
    break
  fi
done

[[ -n "${previous}" ]] || { printf 'Предыдущий релиз не найден.\n' >&2; exit 1; }
ln -sfn "${previous}" "${remote_root}/current.next"
mv -Tf "${remote_root}/current.next" "${remote_root}/current"
nginx -t
systemctl reload nginx
printf 'Активирован релиз %s.\n' "$(basename "${previous}")"
REMOTE_SCRIPT

log "Rollback завершён: https://${DOMAIN}."
