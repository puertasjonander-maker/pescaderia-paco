-- supabase/migrations/001_schema.sql

CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  emoji      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recipes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text UNIQUE NOT NULL,
  title                   text NOT NULL,
  description             text,
  tiktok_url              text NOT NULL,
  tiktok_embed            text,
  tiktok_embed_cached_at  timestamptz,
  thumbnail_url           text,
  category_id             uuid REFERENCES categories(id),
  difficulty              text CHECK (difficulty IN ('fácil','medio','difícil')),
  prep_time               integer,
  cook_time               integer,
  servings                integer,
  published               boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid REFERENCES recipes(id) ON DELETE CASCADE,
  name       text NOT NULL,
  quantity   text,
  unit       text,
  optional   boolean DEFAULT false,
  sort_order integer NOT NULL
);

CREATE TABLE steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id      uuid REFERENCES recipes(id) ON DELETE CASCADE,
  sort_order     integer NOT NULL,
  text           text NOT NULL,
  timer_seconds  integer
);

CREATE TABLE step_ingredients (
  step_id       uuid REFERENCES steps(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, ingredient_id)
);
