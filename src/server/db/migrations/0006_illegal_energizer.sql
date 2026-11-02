CREATE TABLE "optimization_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_date" varchar(100) NOT NULL,
	"mode" varchar(50) DEFAULT 'HYBRID' NOT NULL,
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"input_snapshot" jsonb,
	"result_summary" jsonb,
	"objective_score" numeric(15, 2) DEFAULT '0.00',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "optimization_runs_tenant_id_idx" ON "optimization_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "optimization_runs_service_date_idx" ON "optimization_runs" USING btree ("service_date");