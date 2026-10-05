import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail(email: Email) {
  if (process.env.EMAIL_TRANSPORT === "file") {
    const dir = path.join(process.cwd(), ".mailbox");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2)}.json`), JSON.stringify(email));
    return true;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !process.env.EMAIL_FROM) {
    console.info(`[e-mail] RESEND_API_KEY lub EMAIL_FROM nie ustawione, wiadomość „${email.subject}” nie została wysłana`);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
  });
  if (!res.ok) console.error(`[e-mail] Resend odrzucił wiadomość „${email.subject}”: ${res.status}`);
  return res.ok;
}
