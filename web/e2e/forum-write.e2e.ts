import { createThread, expect, field, register, registerWithVehicle, test, uniqueEmail } from "./helpers";

test("bez auta nie da się pisać, formularz prowadzi do dodania auta", async ({ page }) => {
  await register(page, "Iza", uniqueEmail("bezauta"));
  await page.goto("/forum/nowy");
  await expect(page.getByText("Dodaj auto, żeby pisać")).toBeVisible();
  await expect(page.getByRole("button", { name: "Opublikuj wątek" })).toHaveCount(0);

  await page.goto("/forum/watek/integra-falujace-obroty");
  await expect(page.getByRole("link", { name: /Dodaj auto do garażu/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Wyślij odpowiedź" })).toHaveCount(0);
});

test("gość przy odpowiedzi trafia do logowania z powrotem do wątku", async ({ page }) => {
  await page.goto("/forum/watek/integra-falujace-obroty");
  await page.getByRole("link", { name: "Mam konto, loguję się" }).click();
  await expect(page).toHaveURL(/\/logowanie\?next=%2Fforum%2Fwatek%2Fintegra-falujace-obroty/);
});

test("walidacja nowego wątku", async ({ page }) => {
  await registerWithVehicle(page, "Rafał", "walidacja-watku");
  await page.goto("/forum/nowy");
  await field(page, "Tytuł").fill("Krótki");
  await page.getByRole("button", { name: "Opublikuj wątek" }).click();
  await expect(page.getByText("Tytuł powinien mieć co najmniej 8 znaków.")).toBeVisible();
  await expect(page.getByText("Napisz co najmniej 20 znaków.")).toBeVisible();
  await expect(page.getByText("Wybierz dział.").or(page.getByText("Wybierz dział z listy."))).toBeVisible();
});

test("wątek w dziale usterek dołącza dane auta, renderuje Markdown i trafia na listę", async ({ page }) => {
  await registerWithVehicle(page, "Darek", "usterka");
  const title = `Stuk z przodu na nierównościach ${Date.now()}`;
  await createThread(page, {
    category: "Usterki i diagnostyka",
    title,
    body: "Od tygodnia słyszę **stuk** z lewej strony.\n\n- łączniki stabilizatora nowe\n- tuleje wahacza do sprawdzenia",
    tags: "prelude, h22a, zawieszenie",
  });

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByText("Dane zaciągnięte z garażu autora")).toBeVisible();
  await expect(page.getByText("H22A").first()).toBeVisible();
  await expect(page.getByText("240 000 km")).toBeVisible();
  await expect(page.locator("article strong", { hasText: "stuk" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "łączniki stabilizatora nowe" })).toBeVisible();
  await expect(page.getByText("#zawieszenie")).toBeVisible();
  await expect(page.getByRole("link", { name: /Darek/ }).first()).toBeVisible();

  await page.goto("/forum/usterki");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("odpowiedź, odpowiedź na komentarz i usunięcie własnego komentarza", async ({ page }) => {
  await registerWithVehicle(page, "Gosia", "komentarze");
  await createThread(page, {
    category: "Kawiarenka",
    title: `Najlepsza trasa na weekend ${Date.now()}`,
    body: "Szukam ciekawej trasy na niedzielę, najlepiej z zakrętami i dobrą kawą po drodze.",
  });

  await field(page, "Odpowiedz w wątku").fill("Polecam Pętlę Bieszczadzką.");
  await page.getByRole("button", { name: "Wyślij odpowiedź" }).click();
  const first = page.locator("li[id^=komentarz-]").filter({ hasText: "Polecam Pętlę Bieszczadzką." });
  await expect(first).toBeVisible();
  await expect(page.getByRole("heading", { name: /Odpowiedzi/ })).toContainText("1");

  await first.getByRole("button", { name: "Odpowiedz" }).click();
  await field(page, "Twoja odpowiedź").fill("Dzięki, a gdzie kawa?");
  await first.getByRole("button", { name: "Wyślij odpowiedź" }).click();
  const nested = first.locator("ol li").filter({ hasText: "Dzięki, a gdzie kawa?" });
  await expect(nested).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await nested.getByRole("button", { name: "Usuń" }).click();
  await expect(page.getByText("Dzięki, a gdzie kawa?")).toHaveCount(0);
});

test("Markdown nie wykonuje skryptów ani linków javascript:", async ({ page }) => {
  await registerWithVehicle(page, "Henryk", "xss");
  await createThread(page, {
    category: "Kawiarenka",
    title: `Test formatowania treści ${Date.now()}`,
    body: '<script>window.__xss = 1</script>\n\n<img src=x onerror="window.__xss = 2">\n\n[kliknij](javascript:window.__xss=3)',
  });
  const link = page.getByRole("link", { name: "kliknij" });
  await expect(link).toBeVisible();
  expect(await link.getAttribute("href")).not.toContain("javascript");
  expect(await page.locator("article script").count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

test("autor może usunąć swój wątek", async ({ page }) => {
  await registerWithVehicle(page, "Julia", "usun-watek");
  const title = `Wątek do usunięcia ${Date.now()}`;
  await createThread(page, { category: "Kawiarenka", title, body: "Ten wątek zaraz zniknie, to tylko test usuwania." });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Usuń wątek" }).click();
  await expect(page).toHaveURL(/\/forum\?usunieto=1/);
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
});
