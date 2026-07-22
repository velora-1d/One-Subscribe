CREATE TABLE "promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_amount" integer,
	"min_duration_months" integer DEFAULT 1 NOT NULL,
	"is_catalog_slashed" boolean DEFAULT false NOT NULL,
	"product_id" uuid,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promos_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "applied_promo_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD CONSTRAINT "promos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_applied_promo_id_promos_id_fk" FOREIGN KEY ("applied_promo_id") REFERENCES "public"."promos"("id") ON DELETE set null ON UPDATE no action;