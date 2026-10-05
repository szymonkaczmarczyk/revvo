import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ───────────────────────── Konta ───────────────────────── */

export const userRole = pgEnum("user_role", ["user", "mechanic", "moderator", "admin"]);

// Tabele `users` i `password_reset_tokens` istniały w bazie przed Drizzle (baseline: drizzle/0000_*).
export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: varchar({ length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar({ length: 80 }).notNull(),
    role: userRole().default("user").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("users_email_key").on(t.email)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (t) => [
    index("idx_pwd_reset_tokens")
      .using("btree", t.tokenHash.asc().nullsLast().op("text_ops"))
      .where(sql`(used_at IS NULL)`),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "password_reset_tokens_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

/* ──────────────── Katalog aut (źródło: car2db, baza-danych/) ────────────────
 * Klucze główne = identyfikatory car2db, żeby dało się aktualizować katalog nowszym zrzutem. */

export const carMakes = pgTable("car_makes", {
  id: integer().primaryKey(),
  name: varchar({ length: 80 }).notNull(),
  slug: varchar({ length: 80 }).notNull().unique(),
});

export const carModels = pgTable(
  "car_models",
  {
    id: integer().primaryKey(),
    makeId: integer("make_id")
      .notNull()
      .references(() => carMakes.id, { onDelete: "cascade" }),
    name: varchar({ length: 120 }).notNull(),
    slug: varchar({ length: 120 }).notNull(),
  },
  (t) => [unique("car_models_make_slug").on(t.makeId, t.slug)],
);

export const carGenerations = pgTable(
  "car_generations",
  {
    id: integer().primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => carModels.id, { onDelete: "cascade" }),
    /** Nazwa po polsku, np. „IX generacja (lifting)” albo kod nadwozia „AP2” */
    name: varchar({ length: 120 }).notNull(),
    yearFrom: smallint("year_from"),
    yearTo: smallint("year_to"),
    facelift: smallint().default(0).notNull(),
    /** Zdjęcie katalogowe (1280 px, WebP) w R2; wariant 640 px: ten sam adres z /640.webp */
    imageUrl: text("image_url"),
    /** Atrybucja zdjęcia z Wikimedia Commons (autor, licencja, źródło) — nie jest wyświetlana przy zdjęciu; źródła opisywane osobno */
    imageCredit: jsonb("image_credit").$type<{
      author: string;
      license: string;
      licenseUrl: string;
      sourceUrl: string;
      title: string;
    }>(),
  },
  (t) => [index("car_generations_model_idx").on(t.modelId)],
);

export const carSeries = pgTable(
  "car_series",
  {
    id: integer().primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => carModels.id, { onDelete: "cascade" }),
    generationId: integer("generation_id").references(() => carGenerations.id, { onDelete: "set null" }),
    /** Nazwa wersji nadwozia po polsku, np. „Type R hatchback 3-drzwiowy” */
    name: varchar({ length: 160 }).notNull(),
    /** Znormalizowany typ nadwozia: Sedan, Hatchback, Kombi, SUV… */
    bodyType: varchar("body_type", { length: 40 }),
  },
  (t) => [index("car_series_generation_idx").on(t.generationId), index("car_series_model_idx").on(t.modelId)],
);

export const carTrims = pgTable(
  "car_trims",
  {
    id: integer().primaryKey(),
    serieId: integer("serie_id")
      .notNull()
      .references(() => carSeries.id, { onDelete: "cascade" }),
    modelId: integer("model_id")
      .notNull()
      .references(() => carModels.id, { onDelete: "cascade" }),
    /** Np. „2.0 MT (240 KM)” */
    name: varchar({ length: 160 }).notNull(),
    yearFrom: smallint("year_from"),
    yearTo: smallint("year_to"),
    // Najczęściej używane parametry wyciągnięte z car_trim_specs (do filtrów i plakietek)
    powerHp: smallint("power_hp"),
    engineCc: integer("engine_cc"),
    fuel: varchar({ length: 30 }),
    gearbox: varchar({ length: 40 }),
    drive: varchar({ length: 60 }),
  },
  (t) => [index("car_trims_serie_idx").on(t.serieId), index("car_trims_model_idx").on(t.modelId)],
);

export const carSpecifications = pgTable("car_specifications", {
  id: integer().primaryKey(),
  parentId: integer("parent_id"),
  name: varchar({ length: 120 }).notNull(),
  unit: varchar({ length: 20 }),
  sort: smallint().default(0).notNull(),
});

export const carTrimSpecs = pgTable(
  "car_trim_specs",
  {
    trimId: integer("trim_id")
      .notNull()
      .references(() => carTrims.id, { onDelete: "cascade" }),
    specId: integer("spec_id")
      .notNull()
      .references(() => carSpecifications.id, { onDelete: "cascade" }),
    value: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.trimId, t.specId] })],
);

/* ───────────────────────── Forum ───────────────────────── */

export const forumCategories = pgTable("forum_categories", {
  id: serial().primaryKey(),
  slug: varchar({ length: 60 }).notNull().unique(),
  name: varchar({ length: 80 }).notNull(),
  description: text().notNull(),
  /** Nazwa ikony z lucide-react */
  icon: varchar({ length: 40 }).notNull(),
  sort: smallint().default(0).notNull(),
  /** Dział usterek: przy nowym wątku zapisujemy „migawkę” danych auta autora */
  attachVehicleSnapshot: boolean("attach_vehicle_snapshot").default(false).notNull(),
});

/* ─────────────────────── Garaż i treści ─────────────────────── */

export const vehicleStatus = pgEnum("vehicle_status", ["daily", "build", "weekend", "track"]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar({ length: 160 }).notNull().unique(),
    // Powiązanie z katalogiem (opcjonalne — auto spoza katalogu wpisuje się ręcznie)
    carTrimId: integer("car_trim_id").references(() => carTrims.id, { onDelete: "set null" }),
    make: varchar({ length: 80 }).notNull(),
    model: varchar({ length: 120 }).notNull(),
    variant: varchar({ length: 120 }),
    year: smallint(),
    engine: varchar({ length: 160 }),
    powerHp: smallint("power_hp"),
    paintCode: varchar("paint_code", { length: 80 }),
    mileageKm: integer("mileage_km"),
    status: vehicleStatus().default("daily").notNull(),
    /** [{ category, part }] — do czasu wydzielenia tabeli vehicle_mods */
    mods: jsonb().$type<{ category: string; part: string }[]>().default([]).notNull(),
    coverImageUrl: text("cover_image_url"),
    historyToken: varchar("history_token", { length: 64 }).unique(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vehicles_user_idx").on(t.userId)],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid().defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Auto, „z którego” pisze autor (pisanie wymaga auta w garażu) */
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => forumCategories.id),
    title: varchar({ length: 200 }).notNull(),
    slug: varchar({ length: 220 }).notNull().unique(),
    bodyMd: text("body_md").notNull(),
    tags: text().array().default(sql`'{}'::text[]`).notNull(),
    vehicleSnapshot: jsonb("vehicle_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("posts_category_created_idx").on(t.categoryId, t.createdAt.desc())],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid().defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    bodyMd: text("body_md").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    /** Miękkie usunięcie — zachowuje strukturę drzewa odpowiedzi */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id], name: "comments_parent_fk" }).onDelete("cascade"),
    index("comments_post_idx").on(t.postId, t.createdAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar({ length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("email_verification_user_idx").on(t.userId)],
);

export const rateLimitHits = pgTable(
  "rate_limit_hits",
  {
    id: serial().primaryKey(),
    key: varchar({ length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("rate_limit_key_created_idx").on(t.key, t.createdAt)],
);

export const timelineKind = pgEnum("timeline_kind", ["mod", "service", "track", "photo"]);

export const vehicleTimelineEntries = pgTable(
  "vehicle_timeline_entries",
  {
    id: uuid().defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    kind: timelineKind().notNull(),
    title: varchar({ length: 160 }).notNull(),
    note: text().default("").notNull(),
    happenedOn: date("happened_on", { mode: "string" }).notNull(),
    mileageKm: integer("mileage_km"),
    costPln: integer("cost_pln"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("timeline_vehicle_date_idx").on(t.vehicleId, t.happenedOn.desc())],
);

export const vehiclePhotos = pgTable(
  "vehicle_photos",
  {
    id: uuid().defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    timelineEntryId: uuid("timeline_entry_id").references(() => vehicleTimelineEntries.id, { onDelete: "set null" }),
    storageKey: varchar("storage_key", { length: 200 }).notNull().unique(),
    width: integer().notNull(),
    height: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vehicle_photos_vehicle_idx").on(t.vehicleId, t.createdAt)],
);

export const flameTarget = pgEnum("flame_target", ["vehicle", "post", "comment", "entry"]);

export const flames = pgTable(
  "flames",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: flameTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("flames_user_target").on(t.userId, t.targetType, t.targetId),
    index("flames_target_idx").on(t.targetType, t.targetId),
    index("flames_created_idx").on(t.createdAt),
  ],
);
