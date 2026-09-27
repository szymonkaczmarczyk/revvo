CREATE TYPE "public"."user_role" AS ENUM('user', 'mechanic', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('daily', 'build', 'weekend', 'track');--> statement-breakpoint
CREATE TABLE "car_generations" (
	"id" integer PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"year_from" smallint,
	"year_to" smallint,
	"facelift" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_makes" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	CONSTRAINT "car_makes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" integer PRIMARY KEY NOT NULL,
	"make_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	CONSTRAINT "car_models_make_slug" UNIQUE("make_id","slug")
);
--> statement-breakpoint
CREATE TABLE "car_series" (
	"id" integer PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"generation_id" integer,
	"name" varchar(160) NOT NULL,
	"body_type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "car_specifications" (
	"id" integer PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" varchar(120) NOT NULL,
	"unit" varchar(20),
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_trim_specs" (
	"trim_id" integer NOT NULL,
	"spec_id" integer NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "car_trim_specs_trim_id_spec_id_pk" PRIMARY KEY("trim_id","spec_id")
);
--> statement-breakpoint
CREATE TABLE "car_trims" (
	"id" integer PRIMARY KEY NOT NULL,
	"serie_id" integer NOT NULL,
	"model_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"year_from" smallint,
	"year_to" smallint,
	"power_hp" smallint,
	"engine_cc" integer,
	"fuel" varchar(30),
	"gearbox" varchar(40),
	"drive" varchar(60)
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"body_md" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(40) NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	"attach_vehicle_snapshot" boolean DEFAULT false NOT NULL,
	CONSTRAINT "forum_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"category_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"body_md" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"vehicle_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"car_trim_id" integer,
	"make" varchar(80) NOT NULL,
	"model" varchar(120) NOT NULL,
	"variant" varchar(120),
	"year" smallint,
	"engine" varchar(160),
	"power_hp" smallint,
	"paint_code" varchar(80),
	"mileage_km" integer,
	"status" "vehicle_status" DEFAULT 'daily' NOT NULL,
	"mods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image_url" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "car_generations" ADD CONSTRAINT "car_generations_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_make_id_car_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."car_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_series" ADD CONSTRAINT "car_series_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_series" ADD CONSTRAINT "car_series_generation_id_car_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."car_generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_trim_specs" ADD CONSTRAINT "car_trim_specs_trim_id_car_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."car_trims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_trim_specs" ADD CONSTRAINT "car_trim_specs_spec_id_car_specifications_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."car_specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_trims" ADD CONSTRAINT "car_trims_serie_id_car_series_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."car_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_trims" ADD CONSTRAINT "car_trims_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_car_trim_id_car_trims_id_fk" FOREIGN KEY ("car_trim_id") REFERENCES "public"."car_trims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "car_generations_model_idx" ON "car_generations" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "car_series_generation_idx" ON "car_series" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "car_series_model_idx" ON "car_series" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "car_trims_serie_idx" ON "car_trims" USING btree ("serie_id");--> statement-breakpoint
CREATE INDEX "car_trims_model_idx" ON "car_trims" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "posts_category_created_idx" ON "posts" USING btree ("category_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vehicles_user_idx" ON "vehicles" USING btree ("user_id");