import { expect, test } from "@playwright/test";
import { field } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/kontakt");
});

test("walidacja po stronie serwera wskazuje błędne pola", async ({ page }) => {
  await field(page, "Imię").fill("A");
  await field(page, "E-mail").fill("zly-adres");
  await field(page, "Wiadomość").fill("krótko");
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();

  await expect(page.getByText("Podaj imię (min. 2 znaki).")).toBeVisible();
  await expect(page.getByText("Podaj poprawny adres e-mail.")).toBeVisible();
  await expect(page.getByText("Wybierz temat wiadomości.")).toBeVisible();
  await expect(page.getByText("Wiadomość powinna mieć co najmniej 10 znaków.")).toBeVisible();
  await expect(field(page, "E-mail")).toHaveValue("zly-adres");
});

test("poprawny formularz kończy się potwierdzeniem", async ({ page }) => {
  await field(page, "Imię").fill("Ola");
  await field(page, "E-mail").fill("ola@example.com");
  await field(page, "Temat").selectOption("Pytanie ogólne");
  await field(page, "Wiadomość").fill("Czy planujecie aplikację mobilną dla garażu?");
  await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
  await expect(page.getByRole("status")).toContainText("Wiadomość wysłana");
});

test("pole pułapki na boty jest niewidoczne", async ({ page }) => {
  await expect(page.locator('input[name="website"]')).toBeHidden();
});
