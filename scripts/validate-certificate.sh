#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${DOMAIN:-seeonline.ru}"
CERT_FILE="${CERT_FILE:-${PROJECT_ROOT}/.secrets/${DOMAIN}.fullchain.pem}"
KEY_FILE="${KEY_FILE:-${PROJECT_ROOT}/.secrets/${DOMAIN}.key}"

fail() {
  printf '[ошибка] %s\n' "$*" >&2
  exit 1
}

command -v openssl >/dev/null 2>&1 || fail "Для проверки нужен openssl."
[[ -f "${CERT_FILE}" ]] || fail "Не найден сертификат: ${CERT_FILE}"
[[ -f "${KEY_FILE}" ]] || fail "Не найден приватный ключ: ${KEY_FILE}"

# Сравниваются хеши открытых ключей, поэтому закрытый ключ не выводится в терминал.
cert_hash="$(openssl x509 -in "${CERT_FILE}" -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256)"
key_hash="$(openssl pkey -in "${KEY_FILE}" -pubout -outform DER | openssl dgst -sha256)"
[[ "${cert_hash}" == "${key_hash}" ]] || fail "Сертификат и приватный ключ не образуют пару."

openssl x509 -in "${CERT_FILE}" -noout -checkend 604800 \
  || fail "Срок сертификата закончится менее чем через 7 дней."

openssl x509 -in "${CERT_FILE}" -noout -ext subjectAltName | grep -Eq "DNS:(\\*\\.)?${DOMAIN//./\\.}" \
  || fail "Сертификат не содержит домен ${DOMAIN}."

chmod 600 "${KEY_FILE}"
printf 'Сертификат и ключ корректны для %s.\n' "${DOMAIN}"
openssl x509 -in "${CERT_FILE}" -noout -subject -issuer -dates -fingerprint -sha256
