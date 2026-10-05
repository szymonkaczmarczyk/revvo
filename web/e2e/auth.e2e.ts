import { expect, field, freshPage, latestMail, linkFrom, login, PASSWORD, register, test, uniqueEmail, waitForTurnstile } from "./helpers";

test.describe("rejestracja", () => {
  test("pusty formularz pokazuje błędy przy każdym polu", async ({ page }) => {
    await page.goto("/rejestracja");
    await page.getByRole("button", { name: /Załóż konto/ }).click();
    await expect(page.getByText("Podaj imię (min. 2 znaki).")).toBeVisible();
    await expect(page.getByText("Podaj poprawny adres e-mail.")).toBeVisible();
    await expect(page.getByText("Hasło musi mieć co najmniej 8 znaków.")).toBeVisible();
    await expect(page.getByText("Aby założyć konto, zaakceptuj Regulamin.")).toBeVisible();
    await expect(field(page, "Imię")).toHaveAttribute("aria-invalid", "true");
  });

  test("różne hasła są odrzucane, wpisane dane zostają", async ({ page }) => {
    await page.goto("/rejestracja");
    await field(page, "Imię").fill("Ola");
    await field(page, "E-mail").fill("ola@example.com");
    await field(page, "Hasło", true).fill("tajnehaslo1");
    await field(page, "Powtórz hasło").fill("innehaslo1");
    await page.getByText(/Akceptuję/).click();
    await page.getByRole("button", { name: /Załóż konto/ }).click();
    await expect(page.getByText("Hasła nie są takie same.")).toBeVisible();
    await expect(field(page, "E-mail")).toHaveValue("ola@example.com");
  });

  test("przycisk pokazuje i ukrywa hasło", async ({ page }) => {
    await page.goto("/rejestracja");
    const password = field(page, "Hasło", true);
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Pokaż hasło" }).first().click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ukryj hasło" }).first().click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("nowe konto loguje, wysyła e-mail i prowadzi do dodania auta", async ({ page }) => {
    const email = uniqueEmail("rejestracja");
    await register(page, "Ola", email);
    await expect(page.getByText("Konto gotowe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Menu konta: Ola/ })).toBeVisible();

    const mail = await latestMail(email, /Potwierdź adres e-mail/);
    await page.goto(linkFrom(mail));
    await expect(page).toHaveURL(/email=potwierdzony/);
    await expect(page.getByText("Adres e-mail potwierdzony")).toBeVisible();
    await expect(page.getByText(/Potwierdź adres/)).toHaveCount(0);
  });

  test("drugie konto na ten sam e-mail jest odrzucane", async ({ page, browser }) => {
    const email = uniqueEmail("duplikat");
    await register(page, "Ola", email);

    const other = await freshPage(browser);
    await other.goto("/rejestracja");
    await field(other, "Imię").fill("Ola");
    await field(other, "E-mail").fill(email.toUpperCase());
    await field(other, "Hasło", true).fill(PASSWORD);
    await field(other, "Powtórz hasło").fill(PASSWORD);
    await other.getByText(/Akceptuję/).click();
    await waitForTurnstile(other);
    await other.getByRole("button", { name: /Załóż konto/ }).click();
    await expect(other.getByText(/Konto z tym adresem już istnieje/)).toBeVisible();
    await other.context().close();
  });
});

test.describe("logowanie i sesja", () => {
  test("błędne hasło pokazuje komunikat, poprawne loguje i wraca pod adres next", async ({ page, context }) => {
    const email = uniqueEmail("logowanie");
    await register(page, "Bartek", email);
    await context.clearCookies();

    await login(page, email, "zle-haslo-123");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Nieprawidłowy e-mail lub hasło.");

    await page.goto("/konto");
    await expect(page).toHaveURL(/\/logowanie\?next=%2Fkonto/);
    await field(page, "E-mail").fill(email);
    await field(page, "Hasło", true).fill(PASSWORD);
    await page.getByRole("main").getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/konto$/);
    await expect(page.getByRole("heading", { name: "Ustawienia konta" })).toBeVisible();
  });

  test("ciasteczko sesji jest HttpOnly i SameSite=Lax", async ({ page, context }) => {
    await register(page, "Iga", uniqueEmail("ciastko"));
    const session = (await context.cookies()).find((c) => c.name.includes("revvo_session"));
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Lax");
  });

  test("wylogowanie kończy sesję", async ({ page }) => {
    await register(page, "Kuba", uniqueEmail("wylogowanie"));
    await page.getByRole("button", { name: /Menu konta/ }).click();
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/moj-garaz");
    await expect(page).toHaveURL(/\/logowanie/);
  });

  test("po 5 błędnych hasłach logowanie jest blokowane", async ({ page, context }) => {
    const email = uniqueEmail("limit");
    await register(page, "Zosia", email);
    await context.clearCookies();
    for (let i = 0; i < 5; i++) {
      await login(page, email, `zle-haslo-${i}`);
      await expect(page.getByRole("main").getByRole("alert")).toContainText("Nieprawidłowy");
    }
    await login(page, email);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Za dużo prób");
  });
});

test.describe("reset hasła", () => {
  test("link z e-maila ustawia nowe hasło i działa tylko raz", async ({ page, context }) => {
    const email = uniqueEmail("reset");
    await register(page, "Ewa", email);
    await context.clearCookies();

    await page.goto("/logowanie");
    await page.getByRole("link", { name: "Nie pamiętasz hasła?" }).click();
    await expect(page).toHaveURL(/\/reset-hasla$/);
    await field(page, "E-mail").fill(email);
    await waitForTurnstile(page);
    await page.getByRole("button", { name: "Wyślij link" }).click();
    await expect(page.getByRole("status")).toContainText("Jeśli konto z tym adresem istnieje");

    const link = linkFrom(await latestMail(email, /Ustaw nowe hasło/));
    await page.goto(link);
    await field(page, "Nowe hasło", true).fill("nowe-haslo-e2e-2");
    await field(page, "Powtórz hasło").fill("nowe-haslo-e2e-2");
    await page.getByRole("button", { name: "Zapisz hasło" }).click();
    await expect(page).toHaveURL(/haslo=zmienione/);

    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Link nie działa" })).toBeVisible();

    await context.clearCookies();
    await login(page, email, "nowe-haslo-e2e-2");
    await expect(page).toHaveURL(/\/moj-garaz/);
  });

  test("nieznany adres dostaje tę samą odpowiedź", async ({ page }) => {
    await page.goto("/reset-hasla");
    await field(page, "E-mail").fill(uniqueEmail("nieistnieje"));
    await waitForTurnstile(page);
    await page.getByRole("button", { name: "Wyślij link" }).click();
    await expect(page.getByRole("status")).toContainText("Jeśli konto z tym adresem istnieje");
  });
});

test.describe("konto", () => {
  test("zmiana imienia i hasła", async ({ page, context }) => {
    const email = uniqueEmail("konto");
    await register(page, "Adam", email);
    await page.goto("/konto");

    await page.getByRole("region", { name: "Imię" }).getByLabel("Imię").fill("Adam Nowy");
    await page.getByRole("button", { name: "Zapisz imię" }).click();
    await expect(page.getByText("Zapisano imię.")).toBeVisible();

    await field(page, "Obecne hasło").fill("zle-haslo-1");
    await field(page, "Nowe hasło", true).fill("haslo-po-zmianie-1");
    await field(page, "Powtórz nowe hasło").fill("haslo-po-zmianie-1");
    await page.getByRole("button", { name: "Zmień hasło" }).click();
    await expect(page.getByText("Obecne hasło jest nieprawidłowe.")).toBeVisible();

    await field(page, "Obecne hasło").fill(PASSWORD);
    await field(page, "Nowe hasło", true).fill("haslo-po-zmianie-1");
    await field(page, "Powtórz nowe hasło").fill("haslo-po-zmianie-1");
    await page.getByRole("button", { name: "Zmień hasło" }).click();
    await expect(page.getByText(/Hasło zmienione/)).toBeVisible();

    await context.clearCookies();
    await login(page, email, "haslo-po-zmianie-1");
    await expect(page).toHaveURL(/\/moj-garaz/);
  });

  test("usunięcie konta wymaga hasła i słowa USUŃ", async ({ page, context }) => {
    const email = uniqueEmail("usun");
    await register(page, "Olek", email);
    await page.goto("/konto");

    const danger = page.getByRole("region", { name: "Usuń konto" });
    await danger.getByLabel("Hasło", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Usuń konto na zawsze" }).click();
    await expect(page.getByText("Wpisz USUŃ wielkimi literami")).toBeVisible();

    await danger.getByLabel("Hasło", { exact: true }).fill(PASSWORD);
    await field(page, "Wpisz USUŃ, żeby potwierdzić").fill("USUŃ");
    await page.getByRole("button", { name: "Usuń konto na zawsze" }).click();
    await expect(page).toHaveURL(/konto=usuniete/);

    await context.clearCookies();
    await login(page, email);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Nieprawidłowy e-mail lub hasło.");
  });
});
