import { Suspense } from 'react'
import { getPublishedRecipes, getCategories } from '@/lib/queries'
import { RecipeCard } from '@/components/recipe-card'
import { CategoryFilter } from '@/components/category-filter'
import { FishFilterClient } from '@/components/fish-filter-client'

export const revalidate = 60

interface Props {
  searchParams: Promise<{ categoria?: string; pez?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { categoria, pez } = await searchParams
  const activeSlug = categoria ?? 'todos'
  const activeFish = pez ?? null

  const [recipes, categories] = await Promise.all([
    getPublishedRecipes(activeSlug, activeFish ?? undefined),
    getCategories(),
  ])

  return (
    <main className="min-h-screen px-4 pt-8 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="text-text-secondary text-sm">← Inicio</a>
        <h1 className="text-2xl font-black">Recetas</h1>
      </div>

      <div className="mb-4">
        <Suspense>
          <CategoryFilter categories={categories} activeSlug={activeSlug} />
        </Suspense>
      </div>

      <div className="mb-6">
        <Suspense>
          <FishFilterClient selected={activeFish} />
        </Suspense>
      </div>

      {recipes.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-16">
          No hay recetas en esta categoría todavía 🎣
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={i < 4} />
          ))}
        </div>
      )}
    </main>
  )
}
