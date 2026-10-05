import sharp from "sharp";
import { expect, field, freshPage, registerWithVehicle, test } from "./helpers";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

test("wpis na osi czasu: dodanie, zdjęcie, przebieg auta, edycja i usunięcie", async ({ page }) => {
  await registerWithVehicle(page, "Tadek", "os-czasu");
  const garageUrl = page.url().split("?")[0];

  await page.getByRole("link", { name: "Dodaj wpis" }).click();
  await expect(page).toHaveURL(/\/wpisy\/nowy$/);
  await field(page, "Tytuł").fill("Wymiana oleju i filtrów");
  await field(page, "Data").fill(daysAgo(3));
  await field(page, "Przebieg (km)").fill("245 500");
  await field(page, "Koszt (zł)").fill("640,50");
  await field(page, "Opis").fill("Olej 5W-40, filtr oleju, powietrza i kabinowy.");
  await page.getByRole("button", { name: "Dodaj wpis" }).click();

  await expect(page).toHaveURL(/\/wpisy\/[0-9a-f-]{36}\?dodano=1$/);
  await expect(page.getByText("Wpis dodany.")).toBeVisible();
  const photo = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#444444" } }).jpeg().toBuffer();
  await page.getByLabel("Dodaj zdjęcia auta").setInputFiles({ name: "faktura.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator("#zdjecia li").filter({ has: page.locator("img") })).toHaveCount(1);

  await page.goto(garageUrl);
  const entry = page.locator("li[id^=wpis-]").filter({ hasText: "Wymiana oleju i filtrów" });
  await expect(entry).toBeVisible();
  await expect(entry.getByText("245 500 km")).toBeVisible();
  await expect(entry.getByRole("button", { name: /Powiększ zdjęcie 1 z 1/ })).toBeVisible();
  await expect(entry.getByText("641 zł")).toHaveCount(0);
  await expect(page.locator("dl").getByText("245 500 km")).toBeVisible();

  await entry.getByRole("link", { name: "Edytuj" }).click();
  await expect(page).toHaveURL(/\/wpisy\/[0-9a-f-]{36}$/);
  await field(page, "Tytuł").fill("Wymiana oleju, filtrów i świec");
  await page.getByRole("button", { name: "Zapisz wpis" }).click();
  await expect(page).toHaveURL(/zapisano=1/);
  await expect(page.getByText("Wymiana oleju, filtrów i świec")).toBeVisible();

  await page.locator("li[id^=wpis-]").getByRole("link", { name: "Edytuj" }).click();
  await expect(page).toHaveURL(/\/wpisy\/[0-9a-f-]{36}$/);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Usuń wpis" }).click();
  await expect(page).toHaveURL(garageUrl);
  await expect(page.locator("li[id^=wpis-]")).toHaveCount(0);
});

test("walidacja wpisu", async ({ page }) => {
  await registerWithVehicle(page, "Wanda", "walidacja-wpisu");
  await page.getByRole("link", { name: "Dodaj wpis" }).click();
  await expect(page).toHaveURL(/\/wpisy\/nowy$/);
  await field(page, "Data").fill("2999-01-01");
  await field(page, "Koszt (zł)").fill("dużo");
  await page.getByRole("button", { name: "Dodaj wpis" }).click();
  await expect(page.getByText("Tytuł powinien mieć co najmniej 3 znaki.")).toBeVisible();
  await expect(page.getByText("Data nie może być z przyszłości.")).toBeVisible();
  await expect(page.getByText("Podaj koszt w zł (0–10 000 000).")).toBeVisible();
});

test("historia serwisowa: link z kosztami, oznaczenie wpisów dopisanych później, wyłączenie", async ({ page, browser }) => {
  await registerWithVehicle(page, "Bogdan", "historia");
  const garageUrl = page.url().split("?")[0];

  for (const [title, date, cost] of [
    ["Rozrząd z pompą wody", daysAgo(400), "2100"],
    ["Klocki i tarcze przód", daysAgo(2), "890"],
  ]) {
    await page.goto(garageUrl);
    await page.getByRole("link", { name: "Dodaj wpis" }).click();
    await expect(page).toHaveURL(/\/wpisy\/nowy$/);
    await field(page, "Tytuł").fill(title);
    await field(page, "Data").fill(date);
    await field(page, "Koszt (zł)").fill(cost);
    await page.getByRole("button", { name: "Dodaj wpis" }).click();
    await expect(page).toHaveURL(/dodano=1/);
  }

  await page.goto(garageUrl);
  await page.getByRole("link", { name: "Edytuj auto" }).click();
  await expect(page).toHaveURL(/\/edytuj$/);
  await page.getByRole("button", { name: "Utwórz link do historii" }).click();
  const link = await field(page, "Link do historii").inputValue();
  expect(link).toMatch(/\/historia\/[A-Za-z0-9_-]{40,}$/);

  const buyer = await freshPage(browser);
  await buyer.goto(new URL(link).pathname);
  await expect(buyer.getByRole("heading", { level: 1 })).toHaveText("Honda Prelude BB6 2.2 VTi");
  await expect(buyer.getByText("2990 zł")).toBeVisible();
  await expect(buyer.getByText("Rozrząd z pompą wody")).toBeVisible();
  await expect(buyer.locator("li").filter({ hasText: "Rozrząd z pompą wody" }).getByText(/Wpis uzupełniony później/)).toBeVisible();
  await expect(buyer.locator("li").filter({ hasText: "Klocki i tarcze przód" }).getByText(/^Dodany do Revvo/)).toBeVisible();
  await expect(buyer.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.getByRole("button", { name: "Wyłącz link" }).click();
  await expect(page.getByRole("button", { name: "Utwórz link do historii" })).toBeVisible();
  await buyer.reload();
  await expect(buyer.getByRole("heading", { name: "Ten zjazd nie prowadzi do garażu" })).toBeVisible();
  await buyer.context().close();
});

test("cudzy garaż nie pokazuje narzędzi właściciela osi czasu", async ({ page }) => {
  await registerWithVehicle(page, "Edek", "cudza-os");
  await page.goto("/garaz/honda-nsx-na1-marta");
  await expect(page.getByText("Rozrząd i pompa wody")).toBeVisible();
  await expect(page.getByRole("link", { name: "Dodaj wpis" })).toHaveCount(0);
  await expect(page.locator("li[id^=wpis-]").getByRole("link", { name: "Edytuj" })).toHaveCount(0);
});
