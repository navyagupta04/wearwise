-- Wearwise database schema (PostgreSQL 14+)
-- Apply with: psql "$DATABASE_URL" -f schema.sql
-- The script is idempotent and is also used by `npm run seed`.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_token text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('body', 'garment')),
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skin_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  upload_id uuid NOT NULL REFERENCES uploads(id),
  undertone text,
  tone_value text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('direct', 'occasion')),
  occasion_text text,
  description_text text,
  gender text CHECK (gender IN ('woman', 'man', 'nonbinary', 'prefer_not_to_say')),
  body_upload_id uuid REFERENCES uploads(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- NULL means a reusable SerpAPI catalog row; non-NULL means a frozen session snapshot.
  session_id uuid REFERENCES sessions(id),
  name text NOT NULL,
  source_site text,
  image_url text NOT NULL,
  vto_image_url text,
  buy_url text,
  price text,
  category text,
  color text,
  gender text CHECK (gender IN ('woman', 'man', 'unisex')),
  occasion_tags text,
  rank integer,
  batch_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tryon_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  search_result_id uuid NOT NULL REFERENCES search_results(id),
  body_upload_id uuid NOT NULL REFERENCES uploads(id),
  result_image_url text NOT NULL,
  youcam_request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  resulting_batch_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safe migrations for databases created by earlier project versions.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('woman', 'man', 'nonbinary', 'prefer_not_to_say'));
ALTER TABLE search_results ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('woman', 'man', 'unisex'));
ALTER TABLE search_results ADD COLUMN IF NOT EXISTS occasion_tags text;
ALTER TABLE search_results ADD COLUMN IF NOT EXISTS vto_image_url text;

CREATE INDEX IF NOT EXISTS uploads_user_id_idx ON uploads (user_id);
CREATE INDEX IF NOT EXISTS skin_profile_upload_id_idx ON skin_profile (upload_id);
CREATE INDEX IF NOT EXISTS sessions_user_created_idx ON sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shared_catalog_idx ON search_results (gender, category, color, rank) WHERE session_id IS NULL;
CREATE INDEX IF NOT EXISTS session_catalog_batch_idx ON search_results (session_id, batch_number);
CREATE INDEX IF NOT EXISTS tryon_results_session_idx ON tryon_results (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, created_at);
