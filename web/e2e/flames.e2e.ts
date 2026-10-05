import { expect, freshPage, registerWithVehicle, test } from "./helpers";

test("płomień od innej osoby: zapis, stan po odświeżeniu, cofnięcie i ranking", async ({ page, browser }, info) => {
  const owner = `Leon ${info.project.name} ${Date.now() % 100000}`;
  await registerWithVehicle(page, owner, "plomien-wlasciciel");
  const garageUrl = new URL(page.url()).pathname;

  const ownFlame = page.getByRole("button", { name: /Odpal auto, Miedziany Płomień/ });
  await expect(ownFlame).toHaveAttribute("data-ready", "true");
  await ownFlame.click();
  await expect(page.getByText("To Twoje auto. Płomienie dają inni.")).toBeVisible();
  await expect(ownFlame).toHaveAttribute("aria-pressed", "false");

  const fan = await freshPage(browser);
  await registerWithVehicle(fan, "Fan", "plomien-fan");
  await fan.goto(garageUrl);
  const flame = fan.getByRole("main").getByRole("button", { name: /Miedziany Płomień/ }).first();
  await expect(flame).toContainText("0");
  await expect(flame).toHaveAttribute("data-ready", "true");
  await flame.click();
  await expect(flame).toHaveAttribute("aria-pressed", "true");
  await expect(flame).toHaveAttribute("aria-busy", "false");
  await expect(flame).toContainText("1");

  await fan.reload();
  await expect(flame).toHaveAttribute("data-ready", "true");
  const reloaded = fan.getByRole("button", { name: /Miedziany Płomień/ }).first();
  await expect(reloaded).toHaveAttribute("aria-pressed", "true");
  await expect(reloaded).toContainText("1");

  await fan.goto("/garaz-miesiaca");
  const row = fan.getByRole("listitem").filter({ hasText: `Garaż: ${owner}` });
  await expect(row).toBeVisible();
  await expect(row.getByText(/płomienie 3/)).toBeVisible();

  await fan.goto(garageUrl);
  await expect(flame).toHaveAttribute("data-ready", "true");
  await fan.getByRole("button", { name: /Cofnij odpalenie, Miedziany Płomień/ }).click();
  await expect(fan.getByRole("button", { name: /Odpal auto, Miedziany Płomień/ })).toContainText("0");
  await expect(flame).toHaveAttribute("aria-busy", "false");
  await fan.context().close();

  await page.reload();
  await expect(page.getByRole("button", { name: /Odpal auto, Miedziany Płomień/ })).toContainText("0");
});

test("płomień dla odpowiedzi w wątku", async ({ page }) => {
  await registerWithVehicle(page, "Mira", "plomien-komentarz");
  await page.goto("/forum/watek/integra-falujace-obroty");
  const flame = page.locator("li[id^=komentarz-]").first().locator("article").first().getByRole("button", { name: /Miedziany Płomień/ });
  await expect(flame).toHaveAttribute("data-ready", "true");
  await flame.click();
  await expect(flame).toHaveAttribute("aria-pressed", "true");
  await expect(flame).toHaveAttribute("aria-busy", "false");
  await page.reload();
  await expect(flame).toHaveAttribute("data-ready", "true");
  await expect(flame).toHaveAttribute("aria-pressed", "true");
  await flame.click();
  await expect(flame).toHaveAttribute("aria-pressed", "false");
});

test("Garaż Miesiąca pokazuje ranking i zasady punktacji", async ({ page }) => {
  await page.goto("/garaz-miesiaca");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garaż Miesiąca");
  await expect(page.getByRole("heading", { name: "Jak liczymy punkty" })).toBeVisible();
  await expect(page.getByLabel("Miejsce 1", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(/Prowadzi ·/)).toBeVisible();
});
