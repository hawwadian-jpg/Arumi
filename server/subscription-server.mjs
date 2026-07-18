/**
 * Минимальный приватный backend формы подписки.
 *
 * Сервис слушает только localhost, принимает URL-encoded POST, валидирует
 * e-mail и дописывает запись в NDJSON-файл. Публичный доступ возможен лишь
 * через ограниченный location Nginx.
 */

import { appendFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";

const HOST = process.env.SUBSCRIPTION_HOST ?? "127.0.0.1";
const PORT = Number(process.env.SUBSCRIPTION_PORT ?? 4322);
const DATA_DIRECTORY = process.env.SUBSCRIBERS_DIRECTORY ?? "/var/lib/seeonline";
const SUBSCRIBERS_FILE = `${DATA_DIRECTORY}/subscribers.ndjson`;
const MAX_BODY_SIZE = 8 * 1024;
const RATE_LIMIT_WINDOW = 30_000;
const recentRequests = new Map();

function redirect(response, location) {
  response.writeHead(303, { Location: location, "Cache-Control": "no-store" });
  response.end();
}

function respond(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  response.end(message);
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimited(address) {
  const now = Date.now();
  const previous = recentRequests.get(address) ?? 0;
  recentRequests.set(address, now);

  // Карта очищается лениво, чтобы процесс не накапливал старые IP-адреса.
  if (recentRequests.size > 10_000) {
    for (const [key, timestamp] of recentRequests) {
      if (now - timestamp > RATE_LIMIT_WINDOW) recentRequests.delete(key);
    }
  }

  return now - previous < RATE_LIMIT_WINDOW;
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) throw new Error("BODY_TOO_LARGE");
  }
  return body;
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/api/subscribe") {
    respond(response, 404, "Not found");
    return;
  }

  const address = String(request.headers["x-real-ip"] ?? request.socket.remoteAddress ?? "unknown");
  if (isRateLimited(address)) {
    respond(response, 429, "Please wait before trying again");
    return;
  }

  try {
    const params = new URLSearchParams(await readBody(request));
    const email = String(params.get("email") ?? "").trim().toLowerCase();
    const language = params.get("language") === "en" ? "en" : "ru";
    const honeypot = String(params.get("company") ?? "");

    // Бот получает обычный успешный redirect, но его данные не сохраняются.
    if (honeypot) {
      redirect(response, language === "en" ? "/en/thanks" : "/thanks");
      return;
    }

    if (!isValidEmail(email)) {
      respond(response, 400, language === "en" ? "Invalid email address" : "Некорректный e-mail");
      return;
    }

    await mkdir(DATA_DIRECTORY, { recursive: true, mode: 0o750 });
    const record = JSON.stringify({ email, language, createdAt: new Date().toISOString() });
    await appendFile(SUBSCRIBERS_FILE, `${record}\n`, { encoding: "utf8", mode: 0o640 });
    redirect(response, language === "en" ? "/en/thanks" : "/thanks");
  } catch (error) {
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      respond(response, 413, "Payload too large");
      return;
    }

    console.error("Не удалось сохранить подписку", error);
    respond(response, 500, "Internal server error");
  }
});

server.listen(PORT, HOST);

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error("Ошибка остановки subscription service", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
