'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface EditorStep {
  _key: string
  id?: string
  text: string
  sort_order: number
  _ingredientIds: string[]
}

interface Props {
  steps: EditorStep[]
  ingredientOptions: { id: string; name: string }[]
  onChange: (steps: EditorStep[]) => void
}

interface SortableStepCardProps {
  step: EditorStep
  index: number
  ingredientOptions: { id: string; name: string }[]
  onUpdateText: (key: string, text: string) => void
  onRemove: (key: string) => void
  onToggleIngredient: (stepKey: string, ingId: string) => void
}

function SortableStepCard({ step, index, ingredientOptions, onUpdateText, onRemove, onToggleIngredient }: SortableStepCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step._key })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="bg-surface-alt rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab text-text-secondary px-1 select-none touch-none"
            aria-label="Reordenar"
          >
            ⠿
          </span>
          <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Paso {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(step._key)}
          className="text-red-400 text-sm"
        >
          Eliminar
        </button>
      </div>
      <textarea
        value={step.text}
        onChange={(e) => onUpdateText(step._key, e.target.value)}
        placeholder="Describe este paso..."
        rows={2}
        className="w-full bg-surface text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-3"
      />
      {ingredientOptions.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary mb-2">Ingredientes de este paso:</p>
          <div className="flex flex-wrap gap-2">
            {ingredientOptions.map((ing) => (
              <button
                key={ing.id}
                type="button"
                onClick={() => onToggleIngredient(step._key, ing.id)}
                className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                  step._ingredientIds.includes(ing.id)
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary'
                }`}
              >
                {ing.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function StepsEditor({ steps, ingredientOptions, onChange }: Props) {
  function add() {
    onChange([...steps, {
      _key: crypto.randomUUID(),
      text: '',
      sort_order: steps.length,
      _ingredientIds: [],
    }])
  }

  function remove(key: string) {
    onChange(steps.filter((s) => s._key !== key))
  }

  function updateText(key: string, text: string) {
    onChange(steps.map((s) => s._key === key ? { ...s, text } : s))
  }

  function toggleIngredient(stepKey: string, ingId: string) {
    onChange(steps.map((s) => {
      if (s._key !== stepKey) return s
      const ids = s._ingredientIds.includes(ingId)
        ? s._ingredientIds.filter((id) => id !== ingId)
        : [...s._ingredientIds, ingId]
      return { ...s, _ingredientIds: ids }
    }))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s._key === active.id)
      const newIndex = steps.findIndex((s) => s._key === over.id)
      onChange(arrayMove(steps, oldIndex, newIndex))
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps.map((s) => s._key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <SortableStepCard
              key={step._key}
              step={step}
              index={i}
              ingredientOptions={ingredientOptions}
              onUpdateText={updateText}
              onRemove={remove}
              onToggleIngredient={toggleIngredient}
            />
          ))}
          <button type="button" onClick={add} className="text-primary text-sm font-bold">
            + Añadir paso
          </button>
        </div>
      </SortableContext>
    </DndContext>
  )
}
