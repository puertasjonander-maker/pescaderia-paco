'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IngredientsEditor, type EditorIngredient } from './ingredients-editor'
import { StepsEditor, type EditorStep } from './steps-editor'
import type { Category, RecipeWithRelations } from '@/lib/supabase/types'
import { FISH_CATALOG } from '@/lib/fish-catalog'

// Untyped Supabase client helper to work around strict Database generic constraints
// when Insert/Update types conflict with supabase-js v2 overloads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

interface Props {
  categories: Category[]
  recipe?: RecipeWithRelations
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export function RecipeForm({ categories, recipe }: Props) {
  const router = useRouter()
  const isEdit = !!recipe
  const supabase = createClient()

  const [title, setTitle] = useState(recipe?.title ?? '')
  const [description, setDescription] = useState(recipe?.description ?? '')
  const [tiktokUrl, setTiktokUrl] = useState(recipe?.tiktok_url ?? '')
  const [tiktokEmbed, setTiktokEmbed] = useState(recipe?.tiktok_embed ?? '')
  const [categoryId, setCategoryId] = useState(recipe?.category_id ?? '')
  const [difficulty, setDifficulty] = useState<string>(recipe?.difficulty ?? '')
  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() ?? '')
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() ?? '')
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? '')
  const [published, setPublished] = useState(recipe?.published ?? false)
  const [mainFish, setMainFish] = useState(recipe?.main_fish ?? '')

  const [ingredients, setIngredients] = useState<EditorIngredient[]>(
    recipe?.ingredients.map((i) => ({
      _key: i.id,
      id: i.id,
      name: i.name,
      quantity: i.quantity ?? '',
      unit: i.unit ?? '',
      optional: i.optional,
      sort_order: i.sort_order,
    })) ?? []
  )

  const [steps, setSteps] = useState<EditorStep[]>(
    recipe?.steps.map((s) => ({
      _key: s.id,
      id: s.id,
      text: s.text,
      sort_order: s.sort_order,
      _ingredientIds: s.step_ingredients?.map((si) => si.ingredient_id) ?? [],
    })) ?? []
  )

  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImportTikTok() {
    if (!tiktokUrl) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/tiktok-oembed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tiktokUrl }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error importando vídeo')
      }
      const data = await res.json()
      if (data.title && !title) setTitle(data.title)
      setTiktokEmbed(data.html ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setImporting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Cast to bypass supabase-js v2 strict generic constraints with manual Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: AnySupabase = supabase
      const slug = recipe?.slug ?? generateSlug(title)

      const recipeData: {
        title: string
        slug: string
        description: string | null
        tiktok_url: string
        tiktok_embed: string | null
        tiktok_embed_cached_at: string | null
        category_id: string | null
        difficulty: 'fácil' | 'medio' | 'difícil' | null
        prep_time: number | null
        cook_time: number | null
        servings: number | null
        main_fish: string | null
        published: boolean
      } = {
        title,
        slug,
        description: description || null,
        tiktok_url: tiktokUrl,
        tiktok_embed: tiktokEmbed || null,
        tiktok_embed_cached_at: tiktokEmbed ? new Date().toISOString() : null,
        category_id: categoryId || null,
        difficulty: (difficulty as 'fácil' | 'medio' | 'difícil' | null) || null,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
        main_fish: mainFish || null,
        published,
      }

      let recipeId: string

      if (isEdit) {
        const { error } = await db.from('recipes').update(recipeData).eq('id', recipe.id)
        if (error) throw error
        recipeId = recipe.id

        // Delete all relations before re-inserting
        const stepIds = recipe.steps.map((s) => s.id)
        if (stepIds.length > 0) {
          await db.from('step_ingredients').delete().in('step_id', stepIds)
        }
        await db.from('steps').delete().eq('recipe_id', recipeId)
        await db.from('ingredients').delete().eq('recipe_id', recipeId)
      } else {
        const { data, error } = await db.from('recipes').insert(recipeData).select('id').single()
        if (error) throw error
        recipeId = data.id
      }

      // Insert ingredients and track _key → new id mapping
      const keyToId: Record<string, string> = {}
      if (ingredients.length > 0) {
        const { data: insertedIngs, error } = await db
          .from('ingredients')
          .insert(
            ingredients.map((ing, i) => ({
              recipe_id: recipeId,
              name: ing.name,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              optional: ing.optional,
              sort_order: i,
            }))
          )
          .select('id')
        if (error) throw error
        ingredients.forEach((ing: EditorIngredient, i: number) => {
          keyToId[ing._key] = insertedIngs[i].id
        })
      }

      // Insert steps + step_ingredients
      if (steps.length > 0) {
        const { data: insertedSteps, error: stepsError } = await db
          .from('steps')
          .insert(
            steps.map((step, i) => ({
              recipe_id: recipeId,
              sort_order: i,
              text: step.text,
            }))
          )
          .select('id')
        if (stepsError) throw stepsError

        const stepIngredientsToInsert: { step_id: string; ingredient_id: string }[] = []
        steps.forEach((step: EditorStep, i: number) => {
          step._ingredientIds.forEach((key: string) => {
            const ingredientId = keyToId[key]
            if (ingredientId) {
              stepIngredientsToInsert.push({ step_id: insertedSteps[i].id, ingredient_id: ingredientId })
            }
          })
        })

        if (stepIngredientsToInsert.length > 0) {
          await db.from('step_ingredients').insert(stepIngredientsToInsert)
        }
      }

      router.push('/admin')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error guardando la receta')
    } finally {
      setSaving(false)
    }
  }

  const ingredientOptions = ingredients.map((i) => ({
    id: i._key,
    name: i.name || 'Sin nombre',
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto px-4 pt-6 pb-16">
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin" className="text-text-secondary text-sm">← Admin</a>
        <h1 className="text-2xl font-black">{isEdit ? 'Editar receta' : 'Nueva receta'}</h1>
      </div>

      {/* TikTok URL */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">
          URL de TikTok
        </label>
        <div className="flex gap-2">
          <input
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@elpescaderodemalaga/video/..."
            className="flex-1 bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleImportTikTok}
            disabled={importing || !tiktokUrl}
            aria-label={importing ? 'Importando...' : 'Importar vídeo de TikTok'}
            className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {importing ? '...' : '→'}
          </button>
        </div>
        {tiktokEmbed && <p className="text-green-400 text-xs mt-1">✓ Vídeo importado</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-2">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Prep (min)</label>
          <input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)}
            className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Cocción</label>
          <input type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)}
            className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Personas</label>
          <input type="number" value={servings} onChange={(e) => setServings(e.target.value)}
            className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {/* Category + difficulty */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Categoría</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="">—</option>
            {categories.filter((c) => c.slug !== 'todos').map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Dificultad</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
            <option value="">—</option>
            <option value="fácil">Fácil</option>
            <option value="medio">Medio</option>
            <option value="difícil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Main fish */}
      <div>
        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Pescado principal</label>
        <select value={mainFish} onChange={(e) => setMainFish(e.target.value)} className="w-full bg-surface-alt text-white text-sm rounded-xl px-3 py-2 focus:outline-none">
          <option value="">— Sin especificar —</option>
          {FISH_CATALOG.map((f) => (
            <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>
          ))}
        </select>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-3">Ingredientes</label>
        <IngredientsEditor ingredients={ingredients} onChange={setIngredients} />
      </div>

      {/* Steps */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-primary uppercase mb-3">Pasos</label>
        <StepsEditor steps={steps} ingredientOptions={ingredientOptions} onChange={setSteps} />
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between bg-surface rounded-2xl px-4 py-4">
        <span className="font-bold text-sm">Publicar receta</span>
        <button
          type="button"
          onClick={() => setPublished(!published)}
          role="switch"
          aria-checked={published}
          className={`w-12 h-6 rounded-full transition-colors relative ${published ? 'bg-primary' : 'bg-surface-alt'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${published ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-white font-black py-4 rounded-2xl text-lg disabled:opacity-60"
      >
        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear receta'}
      </button>
    </form>
  )
}
