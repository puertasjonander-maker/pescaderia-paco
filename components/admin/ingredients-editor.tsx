'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface EditorIngredient {
  _key: string
  id?: string
  name: string
  quantity: string
  unit: string
  optional: boolean
  sort_order: number
}

interface Props {
  ingredients: EditorIngredient[]
  onChange: (ingredients: EditorIngredient[]) => void
}

interface SortableIngredientRowProps {
  ing: EditorIngredient
  onUpdate: (key: string, field: keyof EditorIngredient, value: string | boolean) => void
  onRemove: (key: string) => void
}

function SortableIngredientRow({ ing, onUpdate, onRemove }: SortableIngredientRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ing._key })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-secondary px-1 select-none touch-none"
        aria-label="Reordenar"
      >
        ⠿
      </span>
      <input
        value={ing.quantity}
        onChange={(e) => onUpdate(ing._key, 'quantity', e.target.value)}
        placeholder="Cant."
        className="w-16 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        value={ing.unit}
        onChange={(e) => onUpdate(ing._key, 'unit', e.target.value)}
        placeholder="Unidad"
        className="w-20 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        value={ing.name}
        onChange={(e) => onUpdate(ing._key, 'name', e.target.value)}
        placeholder="Ingrediente"
        className="flex-1 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => onRemove(ing._key)}
        className="text-red-400 text-xl px-1"
      >
        ×
      </button>
    </div>
  )
}

export function IngredientsEditor({ ingredients, onChange }: Props) {
  function add() {
    onChange([...ingredients, {
      _key: crypto.randomUUID(),
      name: '',
      quantity: '',
      unit: '',
      optional: false,
      sort_order: ingredients.length,
    }])
  }

  function remove(key: string) {
    onChange(ingredients.filter((i) => i._key !== key))
  }

  function update(key: string, field: keyof EditorIngredient, value: string | boolean) {
    onChange(ingredients.map((i) => i._key === key ? { ...i, [field]: value } : i))
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = ingredients.findIndex((i) => i._key === active.id)
      const newIndex = ingredients.findIndex((i) => i._key === over.id)
      onChange(arrayMove(ingredients, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ingredients.map((i) => i._key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-3">
            {ingredients.map((ing) => (
              <SortableIngredientRow
                key={ing._key}
                ing={ing}
                onUpdate={update}
                onRemove={remove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={add} className="text-primary text-sm font-bold">
        + Añadir ingrediente
      </button>
    </div>
  )
}
