CREATE TABLE "incident_impacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"trip_id" uuid,
	"duty_id" uuid,
	"bus_id" uuid,
	"driver_id" uuid,
	"conductor_id" uuid,
	"impact_type" varchar(50) NOT NULL,
	"impact_level" varchar(50) NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "recovery_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"proposal_number" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PROPOSED' NOT NULL,
	"objective_score" numeric(15, 2) DEFAULT '0.00',
	"trips_recovered" integer DEFAULT 0 NOT NULL,
	"trips_unassigned" integer DEFAULT 0 NOT NULL,
	"buses_used" integer DEFAULT 0 NOT NULL,
	"crew_changes" integer DEFAULT 0 NOT NULL,
	"handovers" integer DEFAULT 0 NOT NULL,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"cancellations" integer DEFAULT 0 NOT NULL,
	"explanation" text,
	"proposal_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rescheduling_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"service_date" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_by" uuid,
	"objective_score" numeric(15, 2) DEFAULT '0.00',
	"trips_affected" integer DEFAULT 0 NOT NULL,
	"trips_recovered" integer DEFAULT 0 NOT NULL,
	"trips_unassigned" integer DEFAULT 0 NOT NULL,
	"resource_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "status" varchar(50) DEFAULT 'OPEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "severity" varchar(50) DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "service_date" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "resource_type" varchar(50);--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "route_id" uuid;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "reported_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "reported_by" uuid;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "start_time" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "expected_end_time" integer;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "actual_end_time" integer;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_duty_id_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."duties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_driver_id_crew_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_impacts" ADD CONSTRAINT "incident_impacts_conductor_id_crew_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_proposals" ADD CONSTRAINT "recovery_proposals_run_id_rescheduling_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."rescheduling_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rescheduling_runs" ADD CONSTRAINT "rescheduling_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rescheduling_runs" ADD CONSTRAINT "rescheduling_runs_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rescheduling_runs" ADD CONSTRAINT "rescheduling_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incident_impacts_incident_id_idx" ON "incident_impacts" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "recovery_proposals_run_id_idx" ON "recovery_proposals" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "rescheduling_runs_tenant_id_idx" ON "rescheduling_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rescheduling_runs_incident_id_idx" ON "rescheduling_runs" USING btree ("incident_id");--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incidents_tenant_id_idx" ON "incidents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "incidents_service_date_idx" ON "incidents" USING btree ("service_date");