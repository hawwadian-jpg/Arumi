#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/connection.sh"

TLS_MODE="${TLS_MODE:-custom}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
CERT_FILE="${CERT_FILE:-${PROJECT_ROOT}/.secrets/${DOMAIN}.fullchain.pem}"
KEY_FILE="${KEY_FILE:-${PROJECT_ROOT}/.secrets/${DOMAIN}.key}"

[[ "${SERVER_USER}" == "root" ]] \
  || die "Первичную настройку запускайте как root: SERVER_USER=root. Для последующих деплоев можно использовать отдельного пользователя с passwordless sudo."
[[ "${TLS_MODE}" == "letsencrypt" || "${TLS_MODE}" == "custom" ]] \
  || die "TLS_MODE должен быть letsencrypt или custom."

prepare_connection

log "Загружаю локальный обработчик подписок."
"${SCP_COMMAND[@]}" "${PROJECT_ROOT}/server/subscription-server.mjs" "${SERVER_USER}@${SERVER_HOST}:/tmp/seeonline-subscription-server.mjs"

if [[ "${TLS_MODE}" == "custom" ]]; then
  DOMAIN="${DOMAIN}" CERT_FILE="${CERT_FILE}" KEY_FILE="${KEY_FILE}" "${SCRIPT_DIR}/validate-certificate.sh"
  log "Загружаю сертификат через защищённое SSH-соединение."
  "${SCP_COMMAND[@]}" "${CERT_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/${DOMAIN}.fullchain.pem"
  "${SCP_COMMAND[@]}" "${KEY_FILE}" "${SERVER_USER}@${SERVER_HOST}:/tmp/${DOMAIN}.key"
fi

log "Устанавливаю Nginx и подготавливаю каталоги на сервере."
remote_exec bash -s -- "${DOMAIN}" "${REMOTE_ROOT}" "${TLS_MODE}" "${LETSENCRYPT_EMAIL}" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

domain="$1"
remote_root="$2"
tls_mode="$3"
letsencrypt_email="$4"

if ! command -v apt-get >/dev/null 2>&1; then
  printf 'Поддерживаются серверы Ubuntu/Debian с apt-get.\n' >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
packages=(nginx curl ca-certificates nodejs)
if [[ "${tls_mode}" == "letsencrypt" ]]; then
  packages+=(certbot python3-certbot-nginx)
fi
apt-get install -y "${packages[@]}"

mkdir -p "${remote_root}/releases" "${remote_root}/shared"
chown -R www-data:www-data "${remote_root}"

install -d -m 755 /opt/seeonline
install -m 644 /tmp/seeonline-subscription-server.mjs /opt/seeonline/subscription-server.mjs
rm -f /tmp/seeonline-subscription-server.mjs
install -d -o www-data -g www-data -m 750 /var/lib/seeonline

cat > /etc/systemd/system/seeonline-subscriptions.service <<'SYSTEMD_SERVICE'
[Unit]
Description=Seeonline subscription form backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
ExecStart=/usr/bin/node /opt/seeonline/subscription-server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/seeonline

[Install]
WantedBy=multi-user.target
SYSTEMD_SERVICE

systemctl daemon-reload
systemctl enable --now seeonline-subscriptions.service

# Первая конфигурация HTTP нужна Certbot для проверки владения доменом.
cat > "/etc/nginx/sites-available/${domain}" <<NGINX_HTTP
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    root ${remote_root}/current;
    index index.html;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;

    error_page 404 /404.html;
    location = /404.html {
        internal;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    location = /api/subscribe {
        client_max_body_size 8k;
        proxy_pass http://127.0.0.1:4322/api/subscribe;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_connect_timeout 3s;
        proxy_read_timeout 5s;
    }

    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location ~* \\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }
}
NGINX_HTTP

ln -sfn "/etc/nginx/sites-available/${domain}" "/etc/nginx/sites-enabled/${domain}"
rm -f /etc/nginx/sites-enabled/default

# До первого deploy создаётся безопасная заглушка, чтобы nginx -t не падал.
if [[ ! -L "${remote_root}/current" ]]; then
  bootstrap="${remote_root}/releases/bootstrap"
  mkdir -p "${bootstrap}"
  printf '<!doctype html><title>Deployment in progress</title>' > "${bootstrap}/index.html"
  chown -R www-data:www-data "${bootstrap}"
  ln -sfn "${bootstrap}" "${remote_root}/current"
fi

nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q 'Status: active'; then
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
fi

if [[ "${tls_mode}" == "letsencrypt" ]]; then
  certbot_args=(--nginx --non-interactive --agree-tos --redirect -d "${domain}")
  if [[ -n "${letsencrypt_email}" ]]; then
    certbot_args+=(--email "${letsencrypt_email}")
  else
    certbot_args+=(--register-unsafely-without-email)
  fi
  certbot "${certbot_args[@]}"
  systemctl enable --now certbot.timer
else
  certificate_name="$(basename "${domain}.fullchain.pem")"
  key_name="$(basename "${domain}.key")"
  install -d -m 700 "/etc/ssl/${domain}"
  install -m 644 "/tmp/${certificate_name}" "/etc/ssl/${domain}/fullchain.pem"
  install -m 600 "/tmp/${key_name}" "/etc/ssl/${domain}/private.key"
  rm -f "/tmp/${certificate_name}" "/tmp/${key_name}"

  cat > "/etc/nginx/sites-available/${domain}" <<NGINX_TLS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    ssl_certificate /etc/ssl/${domain}/fullchain.pem;
    ssl_certificate_key /etc/ssl/${domain}/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;

    root ${remote_root}/current;
    index index.html;

    error_page 404 /404.html;
    location = /404.html {
        internal;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    location = /api/subscribe {
        client_max_body_size 8k;
        proxy_pass http://127.0.0.1:4322/api/subscribe;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_connect_timeout 3s;
        proxy_read_timeout 5s;
    }

    location /_astro/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location ~* \\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }
}
NGINX_TLS

  nginx -t
  systemctl reload nginx
fi

printf 'Сервер подготовлен для %s.\n' "${domain}"
REMOTE_SCRIPT

log "Настройка завершена. Следующий шаг: make deploy."
