'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { RecipeWithRelations, Ingredient } from '@/lib/supabase/types'

interface CookModeProps {
  recipe: RecipeWithRelations
  recipeSlug: string
}

export function CookMode({ recipe, recipeSlug }: CookModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  const steps = recipe.steps
  const step = steps[currentStep]

  // Wake Lock — keep screen on while cooking
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    acquireWakeLock()
    return () => { wakeLock?.release() }
  }, [])

  // Get ingredients associated with this specific step
  const stepIngredientIds = new Set(
    step?.step_ingredients?.map((si) => si.ingredient_id) ?? []
  )
  const stepIngredients: Ingredient[] = recipe.ingredients.filter(
    (ing) => stepIngredientIds.has(ing.id)
  )

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setDone(true)
    }
  }

  function handlePrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="text-3xl font-black mb-3">¡Listo!</h2>
        <p className="text-text-secondary mb-2">{recipe.title}</p>
        <p className="text-text-secondary text-sm mb-8">Buen provecho 🐟</p>
        <a
          href={recipe.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary text-white font-black text-base py-4 rounded-2xl mb-4"
        >
          Ver el vídeo de Fran en TikTok →
        </a>
        <Link href={`/recetas/${recipeSlug}`} className="text-text-secondary text-sm">
          ← Volver a la receta
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-text-secondary text-sm">Paso {currentStep + 1} de {steps.length}</span>
        <Link href={`/recetas/${recipeSlug}`} className="text-text-secondary text-2xl w-10 h-10 flex items-center justify-center">
          ✕
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-alt rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step text */}
      <div className="flex-1">
        <p className="text-3xl font-extrabold leading-tight mb-8">{step.text}</p>

        {stepIngredients.length > 0 && (
          <div className="bg-surface rounded-2xl p-4">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
              Ingredientes de este paso
            </p>
            <ul className="space-y-1">
              {stepIngredients.map((ing) => (
                <li key={ing.id} className="text-sm text-text-secondary">
                  {ing.quantity && <span className="font-bold text-white">{ing.quantity} {ing.unit} </span>}
                  {ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation — large touch targets */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex-1 bg-surface-alt text-white font-bold py-5 rounded-2xl disabled:opacity-30 text-base"
        >
          ← Anterior
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] bg-primary text-white font-black py-5 rounded-2xl text-base"
        >
          {currentStep === steps.length - 1 ? '¡Listo! 🎉' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
