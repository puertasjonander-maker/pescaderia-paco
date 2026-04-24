import { createClient } from '@/lib/supabase/server'
import type { Category, Recipe, RecipeWithRelations } from '@/lib/supabase/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getPublishedRecipes(categorySlug?: string): Promise<Recipe[]> {
  const supabase = await createClient()
  let query = supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (categorySlug && categorySlug !== 'todos') {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (category) query = query.eq('category_id', (category as { id: string }).id)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Recipe[]
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      category:categories(*),
      ingredients(*),
      steps(*, step_ingredients(ingredient_id))
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) return null

  const recipe = data as RecipeWithRelations
  recipe.ingredients.sort((a, b) => a.sort_order - b.sort_order)
  recipe.steps.sort((a, b) => a.sort_order - b.sort_order)
  return recipe
}

export async function getAllRecipesAdmin(): Promise<Recipe[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Recipe[]
}

export async function getRecipeByIdAdmin(id: string): Promise<RecipeWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      category:categories(*),
      ingredients(*),
      steps(*, step_ingredients(ingredient_id))
    `)
    .eq('id', id)
    .single()
  if (error) return null
  const recipe = data as RecipeWithRelations
  recipe.ingredients.sort((a, b) => a.sort_order - b.sort_order)
  recipe.steps.sort((a, b) => a.sort_order - b.sort_order)
  return recipe
}
