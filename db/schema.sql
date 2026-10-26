-- B&M.ai database schema. Applied by `npm run db:migrate` (idempotent).
-- Add changes as new statements at the bottom using IF NOT EXISTS so re-running is safe.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A manufacturer (brand) account.
CREATE TABLE IF NOT EXISTS companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  vertical      text NOT NULL CHECK (vertical IN ('wine_spirits', 'cosmetics', 'pharmaceutical', 'retail')),
  address       text,
  city          text,
  state         text,
  zip           text,
  website       text,
  -- Brand verification: a page can only go live once an admin (or domain check) verifies the company.
  verified_at   timestamptz,
  plan          text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'silver', 'gold', 'platinum')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- People who log in. company_id is null for B&M.ai staff (role = 'bm_admin').
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  first_name     text,
  last_name      text,
  title          text,
  role           text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'bm_admin')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          text PRIMARY KEY,               -- random token stored in an httpOnly cookie
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- A product / SKU and its landing page. The page content lives in `content` (see src/lib/landing.ts).
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sku           text NOT NULL,
  name          text NOT NULL,
  description   text,
  slug          text NOT NULL UNIQUE,         -- public URL: /p/{slug}
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  content       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- draft content being edited
  published_content jsonb,                            -- what consumers see; copied from content on publish
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);

-- A batch of tags ordered or generated together for one product.
CREATE TABLE IF NOT EXISTS tag_batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  tag_type    text NOT NULL DEFAULT 'standard' CHECK (tag_type IN ('standard', 'custom_print', 'wet_inlay')),
  quantity    integer NOT NULL CHECK (quantity > 0),
  label       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One physical tag. The tag stores https://{host}/t/{code}; the server decides where it goes.
-- Never encode the landing page URL on the tag itself (see CLAUDE.md, "Redirect layer").
CREATE TABLE IF NOT EXISTS tags (
  code        text PRIMARY KEY,               -- short random code, e.g. 'K7Q2MX9A'
  batch_id    uuid REFERENCES tag_batches(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  -- Optional override; null means "go to the product's landing page". Phase 2 campaigns set this.
  destination_url text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tags_product_idx ON tags (product_id);

-- One scan (NFC tap or QR scan) of a tag, or a direct visit to a landing page (tag_code null).
CREATE TABLE IF NOT EXISTS taps (
  id          bigserial PRIMARY KEY,
  tag_code    text REFERENCES tags(code) ON DELETE SET NULL,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'nfc' CHECK (source IN ('nfc', 'qr', 'link')),
  visitor_id  text,                           -- random first-party cookie id, not personal data on its own
  device_type text,                           -- 'mobile' | 'tablet' | 'desktop'
  os          text,                           -- 'ios' | 'android' | 'other'
  country     text,
  region      text,
  city        text,                           -- coarse location from IP headers only, never precise GPS
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS taps_product_time_idx ON taps (product_id, created_at);
CREATE INDEX IF NOT EXISTS taps_company_time_idx ON taps (company_id, created_at);

-- A consumer who opted in on a landing page (e.g. "Register this bottle", "Get event invites").
CREATE TABLE IF NOT EXISTS optins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email       text,
  phone       text,
  first_name  text,
  consent_text text NOT NULL,                 -- exact wording the consumer agreed to
  tag_code    text,
  visitor_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Contact Us form submissions from the marketing site.
CREATE TABLE IF NOT EXISTS contact_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  email       text NOT NULL,
  phone       text,
  company     text,
  product     text,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Free starter kit (10 tags) requests.
CREATE TABLE IF NOT EXISTS starter_kit_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES companies(id) ON DELETE SET NULL,
  company_name  text NOT NULL,
  contact_name  text NOT NULL,
  email         text NOT NULL,
  phone         text,
  shipping_address text NOT NULL,
  product_description text NOT NULL,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'approved', 'shipped', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Tag order quotes. Line items and totals are computed by src/lib/pricing.ts and stored as a snapshot.
CREATE TABLE IF NOT EXISTS quotes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lines       jsonb NOT NULL,
  total_cents integer NOT NULL,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'invoiced', 'paid', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Portal tag order requests: who asked, and any notes (delivery date, artwork). Status 'sent' = requested.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES users(id) ON DELETE SET NULL;
