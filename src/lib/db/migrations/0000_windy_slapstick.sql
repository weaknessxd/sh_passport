CREATE TABLE "passport"."insales_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"product_type" text,
	"course_passed" boolean DEFAULT false,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "passport"."presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"series_code" text NOT NULL,
	"config" jsonb NOT NULL,
	"active_from" date,
	"active_until" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport"."stamp_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "passport"."stamps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"stamp_type_id" integer,
	"source_id" text,
	"issued_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stamps_user_id_source_id_unique" UNIQUE("user_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "passport"."user_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"preset_id" integer,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	"source" text NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "user_presets_user_id_preset_id_unique" UNIQUE("user_id","preset_id")
);
--> statement-breakpoint
CREATE TABLE "passport"."user_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" text NOT NULL,
	"item_id" integer,
	"purchased_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passport"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tg_id" bigint NOT NULL,
	"tg_username" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"birth_date" date,
	"display_name" text,
	"signature_text" text,
	"about_owner" text,
	"region_issued" text,
	"custom_slug" text,
	"avatar_url" text,
	"active_preset_id" integer,
	"privacy_settings" jsonb DEFAULT '{}'::jsonb,
	"registered_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_tg_id_unique" UNIQUE("tg_id"),
	CONSTRAINT "users_custom_slug_unique" UNIQUE("custom_slug")
);
--> statement-breakpoint
ALTER TABLE "passport"."stamps" ADD CONSTRAINT "stamps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "passport"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport"."stamps" ADD CONSTRAINT "stamps_stamp_type_id_stamp_types_id_fk" FOREIGN KEY ("stamp_type_id") REFERENCES "passport"."stamp_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport"."user_presets" ADD CONSTRAINT "user_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "passport"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport"."user_presets" ADD CONSTRAINT "user_presets_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "passport"."presets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport"."user_purchases" ADD CONSTRAINT "user_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "passport"."users"("id") ON DELETE cascade ON UPDATE no action;