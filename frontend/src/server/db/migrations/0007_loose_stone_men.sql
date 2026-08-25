ALTER TABLE "incidents" DROP CONSTRAINT "incidents_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_schedule_id_schedules_id_fk";
--> statement-breakpoint
DROP INDEX "incidents_tenant_id_idx";--> statement-breakpoint
DROP INDEX "incidents_schedule_id_idx";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "schedule_id";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "kind";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "resource_type";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "resource_id";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "time";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "resolved";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "incidents" DROP COLUMN "updated_at";