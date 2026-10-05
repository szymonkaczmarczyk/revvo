import "server-only";
import type { Email } from "./index";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://revvo.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(heading: string, paragraphs: string[], cta: { label: string; url: string }, footnote: string) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p)}</p>`).join("");
  return `<!doctype html><html lang="pl"><body style="margin:0;background:#14161B;font-family:Manrope,Arial,sans-serif;color:#E5E7EB">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1A1D24;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-weight:800;letter-spacing:.2em;color:#C87A4B">REVVO</p>
<h1 style="margin:0 0 16px;font-size:22px;color:#E5E7EB">${escapeHtml(heading)}</h1>
${body}
<p style="margin:24px 0"><a href="${cta.url}" style="display:inline-block;background:#C87A4B;color:#14161B;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:10px">${escapeHtml(cta.label)}</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#9CA3AF">${escapeHtml(footnote)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function verificationEmail(to: string, name: string, token: string): Email {
  const url = `${appUrl()}/potwierdz-email?token=${token}`;
  const paragraphs = [`Cześć ${name}!`, "Potwierdź adres e-mail, żeby w pełni korzystać z garażu i forum Revvo."];
  const footnote = "Link jest ważny 48 godzin. Jeśli nie zakładasz konta w Revvo, zignoruj tę wiadomość.";
  return {
    to,
    subject: "Potwierdź adres e-mail w Revvo",
    text: `${paragraphs.join("\n\n")}\n\n${url}\n\n${footnote}`,
    html: layout("Potwierdź adres e-mail", paragraphs, { label: "Potwierdź e-mail", url }, footnote),
  };
}

export function passwordResetEmail(to: string, name: string, token: string): Email {
  const url = `${appUrl()}/nowe-haslo?token=${token}`;
  const paragraphs = [`Cześć ${name}!`, "Ktoś poprosił o ustawienie nowego hasła do Twojego konta w Revvo."];
  const footnote = "Link jest ważny 1 godzinę i działa tylko raz. Jeśli to nie Ty, zignoruj tę wiadomość, hasło się nie zmieni.";
  return {
    to,
    subject: "Ustaw nowe hasło w Revvo",
    text: `${paragraphs.join("\n\n")}\n\n${url}\n\n${footnote}`,
    html: layout("Ustaw nowe hasło", paragraphs, { label: "Ustaw nowe hasło", url }, footnote),
  };
}
