export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "email" | "topic" | "message", string>>;
  values?: { name: string; email: string; topic: string; message: string };
};

export const TOPICS = ["Pytanie ogólne", "Współpraca", "Zgłoszenie treści", "Błąd w serwisie", "Dane osobowe (RODO)"];
