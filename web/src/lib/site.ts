/** Dane kontaktowe i profile społecznościowe — jedno źródło dla stopki, strony kontaktu i dokumentów. */
export const SITE = {
  name: "Revvo",
  url: "https://revvo.com",
  email: "kontakt@revvo.com",
  // TODO(właściciel): prawdziwy numer telefonu i godziny kontaktu
  phone: "+48 000 000 000",
  phoneHours: "pon.–pt. 9:00–17:00",
  // TODO(właściciel): podmień na adresy profili Revvo, gdy zostaną założone
  socials: [
    { id: "facebook", name: "Facebook", href: "https://www.facebook.com/" },
    { id: "instagram", name: "Instagram", href: "https://www.instagram.com/" },
    { id: "x", name: "X (Twitter)", href: "https://x.com/" },
  ],
} as const;

export type SocialId = (typeof SITE.socials)[number]["id"];
