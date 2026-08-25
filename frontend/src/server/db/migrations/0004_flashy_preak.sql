ALTER TABLE "duties" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "trips" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "duties" CASCADE;--> statement-breakpoint
DROP TABLE "trips" CASCADE;--> statement-breakpoint
ALTER TABLE "buses" DROP CONSTRAINT IF EXISTS "buses_tenant_registration_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE "reschedule_actions" DROP CONSTRAINT IF EXISTS "reschedule_actions_duty_id_duties_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "reschedule_actions_duty_id_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SCHEDULER';--> statement-breakpoint
ALTER TABLE "reschedule_actions" DROP COLUMN "duty_id";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "plan";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_tenant_registration_number_unique" UNIQUE("tenant_id","registration_number");--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_tenant_fleet_number_unique" UNIQUE("tenant_id","fleet_number");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_email_unique" UNIQUE("tenant_id","email");