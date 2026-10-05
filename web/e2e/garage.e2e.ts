import { addCatalogVehicle, expect, field, register, test, uniqueEmail } from "./helpers";

test("gość jest przekierowany do logowania z adresem powrotu", async ({ page }) => {
  await page.goto("/moj-garaz/dodaj");
  await expect(page).toHaveURL(/\/logowanie\?next=%2Fmoj-garaz%2Fdodaj/);
});

test("auto z katalogu trafia do garażu z danymi fabrycznymi", async ({ page }) => {
  await register(page, "Marek", uniqueEmail("katalog"));
  await addCatalogVehicle(page);

  await expect(field(page, "Silnik")).not.toHaveValue("");
  await field(page, "Wersja").fill("Type S");
  await field(page, "Rocznik").selectOption({ index: 1 });
  await field(page, "Przebieg (km)").fill("185 000");
  await page.getByText("W trakcie budowy").click();
  await page.getByRole("button", { name: "Dodaj modyfikację" }).click();
  await field(page, "Część lub zmiana").fill("Bilstein B16 PSS10");
  await page.getByRole("button", { name: "Dodaj do garażu" }).click();

  await expect(page).toHaveURL(/\/garaz\/honda-civic-type-s-marek-[0-9a-f]{6}\?dodano=1/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Honda Civic Type S");
  await expect(page.getByText("185 000 km")).toBeVisible();
  await expect(page.getByText("Bilstein B16 PSS10")).toBeVisible();
  await expect(page.getByText("W trakcie budowy").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Edytuj auto" })).toBeVisible();
});

test("walidacja formularza auta wskazuje błędne pola", async ({ page }) => {
  await register(page, "Lena", uniqueEmail("walidacja"));
  await page.goto("/moj-garaz/dodaj?reczne=1");
  await field(page, "Moc (KM)").fill("99999");
  await page.getByRole("button", { name: "Dodaj do garażu" }).click();
  await expect(page.getByText("Podaj markę.")).toBeVisible();
  await expect(page.getByText("Podaj model.")).toBeVisible();
  await expect(page.getByText("Podaj moc w KM (1–2000).")).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Popraw zaznaczone pola.");
});

test("auto spoza katalogu, edycja, auto główne i usunięcie", async ({ page }) => {
  await register(page, "Wiktor", uniqueEmail("reczne"));

  await page.goto("/moj-garaz/dodaj");
  await page.getByRole("link", { name: /Auta nie ma w katalogu/ }).click();
  await expect(page).toHaveURL(/reczne=1/);
  await field(page, "Marka").fill("BMW");
  await field(page, "Model").fill("Seria 3");
  await field(page, "Wersja").fill("E36 328i");
  await field(page, "Rocznik").fill("1997");
  await page.getByRole("button", { name: "Dodaj do garażu" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BMW Seria 3 E36 328i");

  await page.getByRole("link", { name: "Edytuj auto" }).click();
  await expect(page).toHaveURL(/\/edytuj$/);
  await field(page, "Kod lakieru").fill("Hellrot 314");
  await page.getByRole("button", { name: "Zapisz zmiany" }).click();
  await expect(page.getByText("Zmiany zapisane.")).toBeVisible();
  await expect(page.getByText("Hellrot 314")).toBeVisible();

  await page.goto("/moj-garaz/dodaj?reczne=1");
  await field(page, "Marka").fill("Mazda");
  await field(page, "Model").fill("MX-5");
  await page.getByRole("button", { name: "Dodaj do garażu" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mazda MX-5");

  await page.goto("/moj-garaz");
  const cards = page.getByRole("main").locator("li").filter({ has: page.getByRole("heading", { level: 2 }) });
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: "BMW" }).getByText("Auto główne")).toBeVisible();
  await cards.filter({ hasText: "Mazda" }).getByRole("button", { name: "Ustaw jako główne" }).click();
  await expect(cards.filter({ hasText: "Mazda" }).getByText("Auto główne")).toBeVisible();

  await cards.filter({ hasText: "BMW" }).getByRole("link", { name: "Edytuj" }).click();
  await expect(page).toHaveURL(/\/edytuj$/);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Usuń auto" }).click();
  await expect(page).toHaveURL(/usunieto=1/);
  await expect(cards).toHaveCount(1);
});

test("nie da się edytować cudzego auta", async ({ page }) => {
  await register(page, "Hania", uniqueEmail("cudze"));
  await page.goto("/moj-garaz/00000000-0000-0000-0000-000000000000/edytuj");
  await expect(page.getByRole("heading", { name: "Ten zjazd nie prowadzi do garażu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zapisz zmiany" })).toHaveCount(0);
});

test("garaż demo czyta dane z bazy", async ({ page }) => {
  await page.goto("/garaz/honda-civic-type-r-fn2-tomek");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Honda Civic Type R FN2");
  await expect(page.getByText("Montaż Bilstein B16")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edytuj auto" })).toHaveCount(0);
});
