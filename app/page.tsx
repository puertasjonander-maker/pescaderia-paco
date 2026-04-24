import { Suspense } from 'react'
import Link from 'next/link'
import { getPublishedRecipes, getCategories } from '@/lib/queries'
import { RecipeCard } from '@/components/recipe-card'

export const revalidate = 60

export default async function HomePage() {
  const [recipes, categories] = await Promise.all([
    getPublishedRecipes(),
    getCategories(),
  ])

  const featured = recipes.slice(0, 12)

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-bold tracking-widest text-primary uppercase">Pescadería Paco</span>
        </div>
        <h1 className="text-5xl font-black leading-none mb-2">
          Recetas<br />del Mar 🎣
        </h1>
        <p className="text-text-secondary text-sm mt-3">
          Por{' '}
          <a
            href="https://www.tiktok.com/@elpescaderodemalaga"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold"
          >
            @elpescaderodemalaga
          </a>{' '}
          · Málaga
        </p>
      </section>

      {/* Category pills */}
      <section className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/recetas?categoria=${cat.slug}`}
              className="flex-none px-4 py-2 rounded-full text-sm font-semibold bg-surface-alt text-text-secondary hover:text-white transition-colors whitespace-nowrap"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Recipe grid */}
      <section className="px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Recetas</h2>
          <Link href="/recetas" className="text-primary text-sm font-bold">Ver todas →</Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-12">Próximamente más recetas 🎣</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {featured.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
