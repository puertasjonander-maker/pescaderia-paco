-- supabase/migrations/002_rls.sql

ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_ingredients ENABLE ROW LEVEL SECURITY;

-- Public: read published recipes + their relations
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "public_read_published_recipes"
  ON recipes FOR SELECT USING (published = true);

CREATE POLICY "public_read_ingredients"
  ON ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = ingredients.recipe_id AND r.published = true
  ));

CREATE POLICY "public_read_steps"
  ON steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = steps.recipe_id AND r.published = true
  ));

CREATE POLICY "public_read_step_ingredients"
  ON step_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM steps s
    JOIN recipes r ON r.id = s.recipe_id
    WHERE s.id = step_ingredients.step_id AND r.published = true
  ));

-- Admin: full access for Fran's email only
CREATE POLICY "admin_all_categories"
  ON categories FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_recipes"
  ON recipes FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_ingredients"
  ON ingredients FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_steps"
  ON steps FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');

CREATE POLICY "admin_all_step_ingredients"
  ON step_ingredients FOR ALL USING (auth.email() = 'pescaderotiktokero@gmail.com');
