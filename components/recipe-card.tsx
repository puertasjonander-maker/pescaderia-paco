import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/lib/supabase/types'

interface RecipeCardProps {
  recipe: Recipe
  priority?: boolean
}

export function RecipeCard({ recipe, priority = false }: RecipeCardProps) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <Link href={`/recetas/${recipe.slug}`} className="block group">
      <div className="bg-surface rounded-2xl overflow-hidden hover:ring-1 hover:ring-primary transition-all">
        <div className="relative aspect-square bg-surface-alt">
          {recipe.thumbnail_url ? (
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🐟</div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold leading-tight mb-2 line-clamp-2">{recipe.title}</h3>
          <div className="flex gap-2 flex-wrap">
            {totalTime > 0 && (
              <span className="text-xs text-text-secondary bg-surface-alt px-2 py-1 rounded-md">
                ⏱ {totalTime}min
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-xs text-text-secondary bg-surface-alt px-2 py-1 rounded-md">
                {recipe.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
