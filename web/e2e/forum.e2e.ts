import { expect, test } from "@playwright/test";

test("lista wątków prowadzi do wątku z odpowiedziami", async ({ page }) => {
  await page.goto("/forum");
  const firstThread = page.locator('a[href="/forum/watek/integra-falujace-obroty"]').first();
  const title = (await firstThread.innerText()).trim();
  await firstThread.click();
  await expect(page).toHaveURL(/\/forum\/watek\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title.split("\n")[0]);
  await expect(page.locator("article").first()).toBeVisible();
});

test("wątek z działu usterek pokazuje dane auta autora", async ({ page }) => {
  await page.goto("/forum/watek/integra-falujace-obroty");
  await expect(page.getByText(/zaciągnięte z garażu/i).first()).toBeVisible();
});

test("gość widzi blokadę pisania i link do rejestracji", async ({ page }) => {
  await page.goto("/forum/watek/integra-falujace-obroty");
  await expect(page.getByText("Bez auta czytasz. Z autem piszesz.").first()).toBeVisible();
  await page.getByRole("link", { name: /Załóż garaż i dodaj auto/ }).first().click();
  await expect(page).toHaveURL(/\/rejestracja$/);
});

test("gość klikający Miedziany Płomień trafia do logowania", async ({ page }) => {
  await page.goto("/forum/watek/integra-falujace-obroty");
  await page.getByRole("button", { name: /Odpal wątek, Miedziany Płomień/ }).click();
  await expect(page).toHaveURL(/\/logowanie\?next=%2Fforum%2Fwatek%2Fintegra-falujace-obroty/);
});

test("wszystkie działy forum są dostępne", async ({ page }) => {
  await page.goto("/forum");
  const links = await page.locator('a[href^="/forum/"]:not([href^="/forum/watek/"])').evaluateAll((anchors) =>
    [...new Set(anchors.map((a) => a.getAttribute("href")))],
  );
  expect(links.length).toBeGreaterThanOrEqual(11);
  for (const href of links) {
    const response = await page.request.get(href!);
    expect(response.status(), href!).toBe(200);
  }
});

test("plakietka auta w wątku prowadzi do garażu", async ({ page }) => {
  await page.goto("/forum/watek/integra-falujace-obroty");
  await page.locator('a[href^="/garaz/"]').first().click();
  await expect(page).toHaveURL(/\/garaz\//);
  await expect(page.getByText(/Garaż:/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Wróć do forum/ })).toBeVisible();
});
