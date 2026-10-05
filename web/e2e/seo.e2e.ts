import { expect, test } from "@playwright/test";

test("każda podstrona ma unikalny meta title", async ({ page }) => {
  const titles = new Map<string, string>();
  for (const path of ["/", "/forum", "/katalog", "/kontakt", "/regulamin", "/polityka-prywatnosci", "/rejestracja", "/logowanie"]) {
    await page.goto(path);
    const title = await page.title();
    expect(titles.has(title), `${path} powtarza tytuł ${titles.get(title)}`).toBe(false);
    titles.set(title, path);
  }
});

test("strona ma obraz Open Graph", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test("robots.txt i sitemap.xml są dostępne", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
});

test("favicon jest dostępny", async ({ request }) => {
  expect((await request.get("/favicon.ico")).status()).toBe(200);
});

test("strona 404 ma własny wygląd serwisu", async ({ page }) => {
  await page.goto("/to-nie-istnieje");
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /forum|strona główna/i }).first()).toBeVisible();
});
