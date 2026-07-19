import type { APIRoute } from "astro";
import { content, defaultLocale, locales } from "@/content/site";

/**
 * Публичная read-only копия конфига. Её можно открыть в браузере по адресу
 * /api/config.json или использовать в другом приложении. Секреты сюда добавлять нельзя.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ defaultLocale, locales, content }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });

export const prerender = true;
