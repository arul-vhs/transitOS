CREATE TABLE "buses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"fleet_number" varchar(50),
	"depot" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"bus_type" varchar(100),
	"capacity" integer,
	"available_from" integer DEFAULT 330 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buses_tenant_registration_unique" UNIQUE("tenant_id","registration_number")
);
--> statement-breakpoint
CREATE TABLE "crew" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"depot" varchar(255) NOT NULL,
	"available_from" integer DEFAULT 330 NOT NULL,
	"rest_until" integer DEFAULT 330 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crew_tenant_employee_id_unique" UNIQUE("tenant_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "duties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"bus_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"conductor_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"status" varchar(50) DEFAULT 'valid' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"kind" varchar(50) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"time" integer NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reschedule_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"duty_id" uuid NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"before_data" jsonb,
	"after_data" jsonb,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"origin" varchar(255),
	"destination" varchar(255),
	"length_km" numeric(10, 2) NOT NULL,
	"duration_min" integer NOT NULL,
	"geometry_geojson" jsonb,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "routes_tenant_code_unique" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"date" varchar(100) NOT NULL,
	"depot" varchar(255) NOT NULL,
	"duty_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"latitude" numeric(10, 6),
	"longitude" numeric(10, 6)
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" varchar(50) DEFAULT 'starter' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"service_date" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'dispatcher' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew" ADD CONSTRAINT "crew_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_driver_id_crew_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_conductor_id_crew_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."crew"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD CONSTRAINT "reschedule_actions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD CONSTRAINT "reschedule_actions_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD CONSTRAINT "reschedule_actions_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD CONSTRAINT "reschedule_actions_duty_id_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."duties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buses_tenant_id_idx" ON "buses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "crew_tenant_id_idx" ON "crew" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "duties_tenant_id_idx" ON "duties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "duties_schedule_id_idx" ON "duties" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "duties_bus_id_idx" ON "duties" USING btree ("bus_id");--> statement-breakpoint
CREATE INDEX "duties_driver_id_idx" ON "duties" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "duties_conductor_id_idx" ON "duties" USING btree ("conductor_id");--> statement-breakpoint
CREATE INDEX "duties_route_id_idx" ON "duties" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "duties_trip_id_idx" ON "duties" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "incidents_tenant_id_idx" ON "incidents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "incidents_schedule_id_idx" ON "incidents" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "reschedule_actions_tenant_id_idx" ON "reschedule_actions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "reschedule_actions_schedule_id_idx" ON "reschedule_actions" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "reschedule_actions_incident_id_idx" ON "reschedule_actions" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "reschedule_actions_duty_id_idx" ON "reschedule_actions" USING btree ("duty_id");--> statement-breakpoint
CREATE INDEX "routes_tenant_id_idx" ON "routes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "schedules_tenant_id_idx" ON "schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stops_tenant_id_idx" ON "stops" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stops_route_id_idx" ON "stops" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "trips_tenant_id_idx" ON "trips" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "trips_route_id_idx" ON "trips" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "trips_service_date_idx" ON "trips" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");