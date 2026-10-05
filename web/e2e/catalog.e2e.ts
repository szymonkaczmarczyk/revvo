import { expect, test } from "@playwright/test";

test("katalog prowadzi od marki do generacji modelu", async ({ page }) => {
  await page.goto("/katalog");
  await expect(page.getByText(/Honda/).first()).toBeVisible();
  await expect(page.getByText(/Infiniti/).first()).toBeVisible();

  const modelLink = page.locator('a[href^="/katalog/"]').first();
  await modelLink.click();
  await expect(page).toHaveURL(/\/katalog\/[^/]+\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/KM/).first()).toBeVisible();
});

test("zdjęcia katalogu mają tekst alternatywny", async ({ page }) => {
  await page.goto("/katalog");
  const missingAlt = await page.locator("img:not([alt])").count();
  expect(missingAlt).toBe(0);
});

test("garaż z katalogu linkuje do danych fabrycznych", async ({ page }) => {
  await page.goto("/garaz/honda-integra-type-r-dc2-piotr");
  const link = page.getByRole("link", { name: /Dane fabryczne w katalogu/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/katalog\//);
});
