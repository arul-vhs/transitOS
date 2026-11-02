CREATE TABLE "operational_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"trip_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"event_time" timestamp DEFAULT now() NOT NULL,
	"recorded_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "planned_start" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "actual_start" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "planned_end" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "actual_end" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "departure_variance" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "arrival_variance" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "planned_duration" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "actual_duration" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "duration_variance" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operational_events" ADD CONSTRAINT "operational_events_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operational_events_tenant_id_idx" ON "operational_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "operational_events_trip_id_idx" ON "operational_events" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "operational_events_event_time_idx" ON "operational_events" USING btree ("event_time");