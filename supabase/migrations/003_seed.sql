-- supabase/migrations/003_seed.sql
INSERT INTO categories (name, slug, emoji) VALUES
  ('Todos',        'todos',        '🎣'),
  ('Pescados',     'pescados',     '🐟'),
  ('Mariscos',     'mariscos',     '🦞'),
  ('Arroces',      'arroces',      '🍚'),
  ('Cefalópodos',  'cefalopodos',  '🦑'),
  ('Guisos',       'guisos',       '🍲');
