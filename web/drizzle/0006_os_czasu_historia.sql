ALTER TABLE "vehicle_photos" ADD COLUMN "timeline_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "vehicle_timeline_entries" ADD COLUMN "cost_pln" integer;--> statement-breakpoint
ALTER TABLE "vehicle_timeline_entries" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "history_token" varchar(64);--> statement-breakpoint
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_timeline_entry_id_vehicle_timeline_entries_id_fk" FOREIGN KEY ("timeline_entry_id") REFERENCES "public"."vehicle_timeline_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_history_token_unique" UNIQUE("history_token");