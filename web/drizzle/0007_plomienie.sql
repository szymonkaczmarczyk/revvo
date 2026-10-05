CREATE TYPE "public"."flame_target" AS ENUM('vehicle', 'post', 'comment', 'entry');--> statement-breakpoint
CREATE TABLE "flames" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" "flame_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flames_user_target" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
ALTER TABLE "flames" ADD CONSTRAINT "flames_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flames_target_idx" ON "flames" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "flames_created_idx" ON "flames" USING btree ("created_at");