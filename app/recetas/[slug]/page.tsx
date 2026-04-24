import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getRecipeBySlug } from '@/lib/queries'
import { TikTokEmbed } from '@/components/tiktok-embed'
import { IngredientList } from '@/components/ingredient-list'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) return {}
  return {
    title: `${recipe.title} — Pescadería Paco`,
    description: recipe.description ?? `Receta de ${recipe.title} por El Pescadero Tiktokero`,
    openGraph: {
      images: recipe.thumbnail_url ? [recipe.thumbnail_url] : [],
    },
  }
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)
  if (!recipe) notFound()

  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <main className="min-h-screen pb-24">
      {/* Back nav */}
      <div className="px-4 pt-6 mb-4">
        <Link href="/recetas" className="text-text-secondary text-sm">← Recetas</Link>
      </div>

      {/* Title */}
      <section className="px-4 mb-6">
        <h1 className="text-3xl font-black leading-tight mb-3">{recipe.title}</h1>
        <div className="flex gap-2 flex-wrap">
          {totalTime > 0 && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">⏱ {totalTime} min</span>
          )}
          {recipe.difficulty && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">👨‍🍳 {recipe.difficulty}</span>
          )}
          {recipe.servings && (
            <span className="text-xs text-text-secondary bg-surface px-3 py-1.5 rounded-lg">🍽 {recipe.servings} personas</span>
          )}
        </div>
      </section>

      {/* TikTok video */}
      <section className="px-4 mb-6">
        <TikTokEmbed embedHtml={recipe.tiktok_embed} tiktokUrl={recipe.tiktok_url} />
      </section>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-4">
            Ingredientes ({recipe.ingredients.length})
          </h2>
          <IngredientList ingredients={recipe.ingredients} />
        </section>
      )}

      {/* Steps preview */}
      {recipe.steps.length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-4">
            Pasos ({recipe.steps.length})
          </h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={step.id} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-alt text-xs font-bold flex-none flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Sticky CTA */}
      {recipe.steps.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <Link
            href={`/recetas/${recipe.slug}/cocinar`}
            className="block w-full bg-primary text-white text-center font-black text-lg py-4 rounded-2xl"
          >
            🍳 Empezar a cocinar
          </Link>
        </div>
      )}
    </main>
  )
}
