'use client'

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

  return (
    <div>
      <div className="space-y-2 mb-3">
        {ingredients.map((ing) => (
          <div key={ing._key} className="flex gap-2 items-center">
            <input
              value={ing.quantity}
              onChange={(e) => update(ing._key, 'quantity', e.target.value)}
              placeholder="Cant."
              className="w-16 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={ing.unit}
              onChange={(e) => update(ing._key, 'unit', e.target.value)}
              placeholder="Unidad"
              className="w-20 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={ing.name}
              onChange={(e) => update(ing._key, 'name', e.target.value)}
              placeholder="Ingrediente"
              className="flex-1 bg-surface-alt text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => remove(ing._key)}
              className="text-red-400 text-xl px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="text-primary text-sm font-bold">
        + Añadir ingrediente
      </button>
    </div>
  )
}
