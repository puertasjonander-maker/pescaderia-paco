'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/supabase/types'

interface CategoryFilterProps {
  categories: Category[]
  activeSlug: string
}

export function CategoryFilter({ categories, activeSlug }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'todos') {
      params.delete('categoria')
    } else {
      params.set('categoria', slug)
    }
    router.push(`/recetas?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat) => {
        const isActive = cat.slug === activeSlug
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.slug)}
            className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-white'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        )
      })}
    </div>
  )
}
