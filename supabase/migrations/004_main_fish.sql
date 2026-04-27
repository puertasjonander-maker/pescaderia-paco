-- supabase/migrations/004_main_fish.sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS main_fish text;
