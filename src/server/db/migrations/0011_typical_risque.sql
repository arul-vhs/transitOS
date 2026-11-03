CREATE TABLE "demand_surges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"corridor_name" varchar(255) NOT NULL,
	"service_date" varchar(50) NOT NULL,
	"time_period" varchar(100) NOT NULL,
	"baseline_demand" integer DEFAULT 0 NOT NULL,
	"actual_demand" integer DEFAULT 0 NOT NULL,
	"surge_percentage" numeric(6, 2) DEFAULT '0' NOT NULL,
	"current_capacity" integer DEFAULT 0 NOT NULL,
	"shortage_severity" varchar(50) DEFAULT 'NORMAL' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fleet_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"surge_id" uuid,
	"target_route_id" uuid NOT NULL,
	"bus_id" uuid NOT NULL,
	"driver_id" uuid,
	"conductor_id" uuid,
	"source_type" varchar(50) DEFAULT 'DEPOT_RESERVE' NOT NULL,
	"source_depot" varchar(255),
	"donor_route_id" uuid,
	"allocation_strategy" varchar(50) DEFAULT 'BALANCED_SLA' NOT NULL,
	"deadhead_km" numeric(8, 2) DEFAULT '0' NOT NULL,
	"deadhead_minutes" integer DEFAULT 0 NOT NULL,
	"estimated_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"headway_before_min" integer DEFAULT 0 NOT NULL,
	"headway_after_min" integer DEFAULT 0 NOT NULL,
	"wait_time_before_min" numeric(6, 2) DEFAULT '0' NOT NULL,
	"wait_time_after_min" numeric(6, 2) DEFAULT '0' NOT NULL,
	"load_factor_before" numeric(6, 2) DEFAULT '0' NOT NULL,
	"load_factor_after" numeric(6, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'RECOMMENDED' NOT NULL,
	"dispatched_at" timestamp,
	"dispatched_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "demand_surges" ADD CONSTRAINT "demand_surges_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demand_surges" ADD CONSTRAINT "demand_surges_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_surge_id_demand_surges_id_fk" FOREIGN KEY ("surge_id") REFERENCES "public"."demand_surges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_target_route_id_routes_id_fk" FOREIGN KEY ("target_route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_driver_id_crew_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_conductor_id_crew_id_fk" FOREIGN KEY ("conductor_id") REFERENCES "public"."crew"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_donor_route_id_routes_id_fk" FOREIGN KEY ("donor_route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fleet_allocations" ADD CONSTRAINT "fleet_allocations_dispatched_by_users_id_fk" FOREIGN KEY ("dispatched_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demand_surges_tenant_id_idx" ON "demand_surges" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "demand_surges_route_id_idx" ON "demand_surges" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "demand_surges_service_date_idx" ON "demand_surges" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "fleet_allocations_tenant_id_idx" ON "fleet_allocations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "fleet_allocations_target_route_idx" ON "fleet_allocations" USING btree ("target_route_id");--> statement-breakpoint
CREATE INDEX "fleet_allocations_bus_id_idx" ON "fleet_allocations" USING btree ("bus_id");