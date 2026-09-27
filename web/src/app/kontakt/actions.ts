"use server";

import { SITE } from "@/lib/site";
import { type ContactState, TOPICS } from "./shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  const values = {
    name: String(form.get("name") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    topic: String(form.get("topic") ?? ""),
    message: String(form.get("message") ?? "").trim(),
  };

  // Pułapka na boty: pole niewidoczne dla ludzi
  if (form.get("website")) return { status: "ok", message: "Dziękujemy! Odpowiemy najszybciej, jak to możliwe." };

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2) errors.name = "Podaj imię (min. 2 znaki).";
  if (!EMAIL_RE.test(values.email)) errors.email = "Podaj poprawny adres e-mail.";
  if (!TOPICS.includes(values.topic)) errors.topic = "Wybierz temat wiadomości.";
  if (values.message.length < 10) errors.message = "Wiadomość powinna mieć co najmniej 10 znaków.";
  if (values.message.length > 5000) errors.message = "Wiadomość może mieć maksymalnie 5000 znaków.";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  const to = process.env.CONTACT_TO;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    // Tryb deweloperski: bez CONTACT_TO wiadomość nie jest wysyłana
    console.info("[kontakt] CONTACT_TO nie ustawione — wiadomość nie została wysłana", { topic: values.topic });
    return { status: "ok", message: "Dziękujemy! Wiadomość została przyjęta (tryb testowy — wysyłka e-mail wyłączona)." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      reply_to: values.email,
      subject: `[Revvo · ${values.topic}] ${values.name}`,
      text: `${values.message}\n\n— ${values.name} <${values.email}>`,
    }),
  });
  if (!res.ok) {
    return {
      status: "error",
      values,
      message: `Nie udało się wysłać wiadomości. Napisz bezpośrednio na ${SITE.email}.`,
    };
  }
  return { status: "ok", message: "Dziękujemy! Odpowiemy najszybciej, jak to możliwe — zwykle w ciągu 1–2 dni roboczych." };
}
