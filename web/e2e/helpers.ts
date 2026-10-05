import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { type Browser, expect, type Page, test as base } from "@playwright/test";

const MAILBOX = path.join(__dirname, "..", ".mailbox");

function randomIp() {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
}

export async function freshPage(browser: Browser) {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": randomIp() } });
  return context.newPage();
}

export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
    await provide(context);
  },
});

export { expect };

export function field(page: Page, label: string, exact = false) {
  return page.getByLabel(label, { exact }).filter({ visible: true });
}

export function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export const PASSWORD = "e2e-haslo-testowe-1";

type Mail = { to: string; subject: string; text: string };

export async function latestMail(to: string, subject: RegExp): Promise<Mail> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const files = (await readdir(MAILBOX).catch(() => [] as string[])).sort().reverse();
    for (const file of files) {
      const mail = JSON.parse(await readFile(path.join(MAILBOX, file), "utf8")) as Mail;
      if (mail.to === to && subject.test(mail.subject)) return mail;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Brak e-maila do ${to} (${subject})`);
}

export function linkFrom(mail: Mail) {
  const url = mail.text.match(/https?:\/\/\S+/)?.[0];
  if (!url) throw new Error("E-mail nie zawiera linku");
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export async function waitForTurnstile(page: Page) {
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", { timeout: 15_000 });
}

export async function register(page: Page, name: string, email: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fillRegistration(page, name, email);
      return;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

async function fillRegistration(page: Page, name: string, email: string) {
  await page.goto("/rejestracja");
  await field(page, "Imię").fill(name);
  await field(page, "E-mail").fill(email);
  await field(page, "Hasło", true).fill(PASSWORD);
  await field(page, "Powtórz hasło").fill(PASSWORD);
  await page.getByText(/Akceptuję/).click();
  await waitForTurnstile(page);
  await page.getByRole("button", { name: /Załóż konto/ }).click();
  await expect(page).toHaveURL(/\/moj-garaz\/dodaj\?witaj=1/);
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/logowanie");
  await field(page, "E-mail").fill(email);
  await field(page, "Hasło", true).fill(password);
  await page.getByRole("main").getByRole("button", { name: "Zaloguj się" }).click();
}

export async function addCatalogVehicle(page: Page) {
  await page.goto("/moj-garaz/dodaj");
  await page.getByRole("link", { name: /Honda/ }).first().click();
  await expect(page).toHaveURL(/marka=honda$/);
  await page.getByRole("link", { name: /^Civic/ }).first().click();
  await expect(page).toHaveURL(/model=civic$/);
  await page.getByRole("link", { name: /VIII generacja/ }).first().click();
  await expect(page).toHaveURL(/generacja=\d+$/);
  await page.locator('a[href*="wersja="]').first().click();
  await expect(page).toHaveURL(/wersja=\d+$/);
  await expect(page.getByText("Z katalogu", { exact: true })).toBeVisible();
}

export async function registerWithVehicle(page: Page, name: string, label: string) {
  await register(page, name, uniqueEmail(label));
  await page.goto("/moj-garaz/dodaj?reczne=1");
  await field(page, "Marka").fill("Honda");
  await field(page, "Model").fill("Prelude");
  await field(page, "Wersja").fill("BB6 2.2 VTi");
  await field(page, "Rocznik").fill("1998");
  await field(page, "Silnik").fill("H22A");
  await field(page, "Przebieg (km)").fill("240000");
  await page.getByRole("button", { name: "Dodaj do garażu" }).click();
  await expect(page).toHaveURL(/\/garaz\/.+\?dodano=1/);
}

export async function createThread(page: Page, input: { category: string; title: string; body: string; tags?: string }) {
  await page.goto("/forum/nowy");
  await field(page, "Dział").selectOption({ label: input.category });
  await field(page, "Tytuł").fill(input.title);
  await field(page, "Treść").fill(input.body);
  if (input.tags) await page.getByLabel(/Tagi/).filter({ visible: true }).fill(input.tags);
  await page.getByRole("button", { name: "Opublikuj wątek" }).click();
  await expect(page).toHaveURL(/\/forum\/watek\/.+/);
}
