'use client'
import { useState } from 'react'
import type { Ingredient } from '@/lib/supabase/types'

interface IngredientListProps {
  ingredients: Ingredient[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((ing) => (
        <li
          key={ing.id}
          onClick={() => toggle(ing.id)}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className={`w-5 h-5 rounded border-2 flex-none flex items-center justify-center transition-colors ${
            checked.has(ing.id) ? 'bg-primary border-primary' : 'border-surface-alt'
          }`}>
            {checked.has(ing.id) && <span className="text-white text-xs">✓</span>}
          </div>
          <span className={`text-sm ${checked.has(ing.id) ? 'line-through text-text-secondary' : ''}`}>
            {ing.quantity && <span className="font-bold">{ing.quantity} {ing.unit} </span>}
            {ing.name}
            {ing.optional && <span className="text-text-secondary text-xs"> (opcional)</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
