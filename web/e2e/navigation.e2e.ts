import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", heading: /Twoje auto mówi, kim jesteś/i },
  { path: "/forum", heading: /forum|wątki/i },
  { path: "/forum/usterki", heading: /Usterki i diagnostyka/i },
  { path: "/katalog", heading: /katalog/i },
  { path: "/kontakt", heading: /./ },
  { path: "/regulamin", heading: /Regulamin/i },
  { path: "/polityka-prywatnosci", heading: /Polityka prywatności/i },
  { path: "/rejestracja", heading: /Załóż garaż/i },
  { path: "/logowanie", heading: /Zaloguj się/i },
  { path: "/reset-hasla", heading: /Nowe hasło/i },
  { path: "/garaz-miesiaca", heading: /Garaż Miesiąca/i },
];

for (const { path, heading } of pages) {
  test(`strona ${path} ładuje się bez błędów`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(heading);
    await expect(page).toHaveTitle(/Revvo/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{20,}/);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, "brak poziomego scrolla").toBeLessThanOrEqual(clientWidth);

    expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
  });
}

test("nieistniejące adresy zwracają 404", async ({ page }) => {
  for (const path of ["/to-nie-istnieje", "/forum/brak-dzialu", "/forum/watek/brak", "/garaz/brak-auta"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});

test("nawigacja główna prowadzi do forum i katalogu", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Otwórz menu" }).click();
    await page.locator("#mobile-nav").getByRole("link", { name: "Forum" }).click();
  } else {
    await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Forum" }).click();
  }
  await expect(page).toHaveURL(/\/forum$/);

  if (isMobile) {
    await page.getByRole("button", { name: "Otwórz menu" }).click();
    await page.locator("#mobile-nav").getByRole("link", { name: "Katalog" }).click();
  } else {
    await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("link", { name: "Katalog" }).click();
  }
  await expect(page).toHaveURL(/\/katalog$/);
});

test("menu mobilne otwiera się i zamyka", async ({ page, isMobile }) => {
  test.skip(!isMobile, "tylko mobile");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Otwórz menu" });
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.getByRole("button", { name: "Zamknij menu" }).click();
  await expect(page.locator("#mobile-nav")).toBeHidden();
});

test("stopka linkuje do dokumentów prawnych i kontaktu", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  for (const name of ["Regulamin", "Polityka prywatności", "Kontakt"]) {
    await expect(footer.getByRole("link", { name, exact: true }).first()).toBeVisible();
  }
  await expect(footer.locator('a[href^="mailto:"]').first()).toBeVisible();
});
