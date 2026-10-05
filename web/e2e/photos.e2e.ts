import sharp from "sharp";
import { expect, registerWithVehicle, test } from "./helpers";

async function jpeg(width: number, height: number, color: string) {
  return sharp({ create: { width, height, channels: 3, background: color } }).jpeg({ quality: 80 }).toBuffer();
}

async function openPhotos(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "Edytuj auto" }).click();
  await expect(page).toHaveURL(/\/edytuj$/);
  await expect(page.getByRole("heading", { name: "Zdjęcia" })).toBeVisible();
}

test("zdjęcia auta: okładka, galeria, zmiana okładki i usuwanie", async ({ page }) => {
  await registerWithVehicle(page, "Filip", "zdjecia");
  const garageUrl = page.url().split("?")[0];
  await openPhotos(page);

  const input = page.getByLabel("Dodaj zdjęcia auta");
  await input.setInputFiles([
    { name: "przod.jpg", mimeType: "image/jpeg", buffer: await jpeg(1600, 1000, "#c87a4b") },
    { name: "bok.jpg", mimeType: "image/jpeg", buffer: await jpeg(1600, 1000, "#1b6ca8") },
  ]);
  const tiles = page.locator("#zdjecia li").filter({ has: page.locator("img") });
  await expect(tiles).toHaveCount(2);
  await expect(page.getByText("2 / 24")).toBeVisible();
  await expect(tiles.nth(0).getByText("Okładka")).toBeVisible();

  await tiles.nth(1).getByRole("button", { name: "Ustaw jako okładkę" }).click();
  await expect(tiles.nth(1).getByText("Okładka")).toBeVisible();

  await page.goto(garageUrl);
  await expect(page.getByText("Zdjęcie poglądowe z katalogu")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Zdjęcia/ })).toBeVisible();
  await page.getByRole("button", { name: "Powiększ zdjęcie 1 z 2" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("1 / 2")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText("2 / 2")).toBeVisible();
  await dialog.getByRole("button", { name: "Zamknij galerię" }).click();
  await expect(dialog).toBeHidden();

  await openPhotos(page);
  page.once("dialog", (d) => d.accept());
  await tiles.nth(1).getByRole("button", { name: /Usuń zdjęcie/ }).click();
  await expect(tiles).toHaveCount(1);
  await expect(tiles.nth(0).getByText("Okładka")).toBeVisible();
});

test("odrzuca plik, który nie jest zdjęciem, i za małe zdjęcie", async ({ page }) => {
  await registerWithVehicle(page, "Kamil", "zle-zdjecie");
  await openPhotos(page);
  const input = page.getByLabel("Dodaj zdjęcia auta");

  await input.setInputFiles({ name: "wirus.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<?php echo 'to nie jest zdjęcie'; ?>") });
  await expect(page.getByRole("alert").filter({ hasText: "To nie jest obsługiwany plik graficzny" })).toBeVisible();

  await input.setInputFiles({ name: "mini.jpg", mimeType: "image/jpeg", buffer: await jpeg(300, 200, "#999999") });
  await expect(page.getByRole("alert").filter({ hasText: "Zdjęcie jest za małe" })).toBeVisible();
  await expect(page.getByText("0 / 24")).toBeVisible();
});

test("nie da się wgrać zdjęcia do cudzego auta", async ({ page, request }) => {
  await registerWithVehicle(page, "Ula", "cudze-zdjecie");
  const response = await page.request.post("/api/v1/vehicles/00000000-0000-0000-0000-000000000000/photos", {
    multipart: { photo: { name: "x.jpg", mimeType: "image/jpeg", buffer: await jpeg(800, 600, "#333333") } },
  });
  expect(response.status()).toBe(404);
  const anonymous = await request.post("/api/v1/vehicles/00000000-0000-0000-0000-000000000000/photos");
  expect(anonymous.status()).toBe(401);
});
