ALTER TABLE "passport"."users" ADD COLUMN "theme" text DEFAULT 'Цифровой эскапизм';--> statement-breakpoint
ALTER TABLE "passport"."users" ADD COLUMN "skill_badges" jsonb DEFAULT '[]'::jsonb;