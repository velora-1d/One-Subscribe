ALTER TABLE "credentials" ALTER COLUMN "encrypted_account_email" DROP NOT NULL;
ALTER TABLE "credentials" ALTER COLUMN "encrypted_account_password" DROP NOT NULL;
ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "fulfillment_type" text DEFAULT 'credentials';
ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "fulfillment_data" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_input" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fulfillment_type" text DEFAULT 'credentials' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "download_url" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fulfillment_instructions" text;