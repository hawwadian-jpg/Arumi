import type { APIRoute } from "astro";

/** robots.txt генерируется с абсолютным адресом sitemap для любого домена. */
export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL("http://localhost:4321");
  const sitemapUrl = new URL("/sitemap-index.xml", baseUrl);

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

export const prerender = true;
