ALTER TABLE "routes" ADD COLUMN "direction" varchar(50);--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "color" varchar(50);--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "peak_frequency" integer;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "off_peak_frequency" integer;--> statement-breakpoint
CREATE INDEX "routes_status_idx" ON "routes" USING btree ("status");