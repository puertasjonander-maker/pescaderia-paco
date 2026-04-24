export type Difficulty = 'fácil' | 'medio' | 'difícil'

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  created_at: string
}

export interface Recipe {
  id: string
  slug: string
  title: string
  description: string | null
  tiktok_url: string
  tiktok_embed: string | null
  tiktok_embed_cached_at: string | null
  thumbnail_url: string | null
  category_id: string | null
  difficulty: Difficulty | null
  prep_time: number | null
  cook_time: number | null
  servings: number | null
  published: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Ingredient {
  id: string
  recipe_id: string
  name: string
  quantity: string | null
  unit: string | null
  optional: boolean
  sort_order: number
}

export interface Step {
  id: string
  recipe_id: string
  sort_order: number
  text: string
  timer_seconds: number | null
  step_ingredients?: { ingredient_id: string; ingredient?: Ingredient }[]
}

export interface RecipeWithRelations extends Recipe {
  ingredients: Ingredient[]
  steps: (Step & { step_ingredients: { ingredient_id: string }[] })[]
}

export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at'>; Update: Partial<Category> }
      recipes: { Row: Recipe; Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Recipe> }
      ingredients: { Row: Ingredient; Insert: Omit<Ingredient, 'id'>; Update: Partial<Ingredient> }
      steps: { Row: Step; Insert: Omit<Step, 'id'>; Update: Partial<Step> }
      step_ingredients: { Row: { step_id: string; ingredient_id: string }; Insert: { step_id: string; ingredient_id: string }; Update: never }
    }
  }
}
