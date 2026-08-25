CREATE TABLE "duties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"duty_code" varchar(50) NOT NULL,
	"duty_type" varchar(50) DEFAULT 'LINKED' NOT NULL,
	"service_date" varchar(100) NOT NULL,
	"start_time" integer DEFAULT 0 NOT NULL,
	"end_time" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"bus_id" uuid,
	"driver_id" uuid,
	"conductor_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "duties_tenant_duty_code_unique" UNIQUE("tenant_id","duty_code")
);
--> statement-breakpoint
CREATE TABLE "duty_crew_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"duty_id" uuid NOT NULL,
	"driver_id" uuid,
	"conductor_id" uuid,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"duty_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"handover_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"trip_code" varchar(50) NOT NULL,
	"direction" varchar(50) DEFAULT 'OUTBOUND' NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"duration_min" integer DEFAULT 0 NOT NULL,
	"distance_km" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"origin" varchar(255) DEFAULT '' NOT NULL,
	"destination" varchar(255) DEFAULT '' NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"service_date" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trips_tenant_trip_code_unique" UNIQUE("tenant_id","trip_code")
);
--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD COLUMN "duty_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_driver_id_crew_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duties" ADD CONSTRAINT "duties_conductor_id_crew_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_crew_segments" ADD CONSTRAINT "duty_crew_segments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_crew_segments" ADD CONSTRAINT "duty_crew_segments_duty_id_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."duties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_crew_segments" ADD CONSTRAINT "duty_crew_segments_driver_id_crew_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_crew_segments" ADD CONSTRAINT "duty_crew_segments_conductor_id_crew_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_trips" ADD CONSTRAINT "duty_trips_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_trips" ADD CONSTRAINT "duty_trips_duty_id_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."duties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_trips" ADD CONSTRAINT "duty_trips_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "duties_tenant_id_idx" ON "duties" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "duties_bus_id_idx" ON "duties" USING btree ("bus_id");--> statement-breakpoint
CREATE INDEX "duties_driver_id_idx" ON "duties" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "duties_conductor_id_idx" ON "duties" USING btree ("conductor_id");--> statement-breakpoint
CREATE INDEX "duty_crew_segments_tenant_id_idx" ON "duty_crew_segments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "duty_crew_segments_duty_id_idx" ON "duty_crew_segments" USING btree ("duty_id");--> statement-breakpoint
CREATE INDEX "duty_trips_tenant_id_idx" ON "duty_trips" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "duty_trips_duty_id_idx" ON "duty_trips" USING btree ("duty_id");--> statement-breakpoint
CREATE INDEX "duty_trips_trip_id_idx" ON "duty_trips" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trips_tenant_id_idx" ON "trips" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "trips_route_id_idx" ON "trips" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "trips_service_date_idx" ON "trips" USING btree ("service_date");--> statement-breakpoint
ALTER TABLE "reschedule_actions" ADD CONSTRAINT "reschedule_actions_duty_id_duties_id_fk" FOREIGN KEY ("duty_id") REFERENCES "public"."duties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reschedule_actions_duty_id_idx" ON "reschedule_actions" USING btree ("duty_id");