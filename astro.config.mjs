import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// SITE_URL задаётся в панели хостинга. Локальное значение позволяет собрать
// проект без дополнительной настройки и получить корректные canonical-ссылки.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://seeonline.ru",
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
});
