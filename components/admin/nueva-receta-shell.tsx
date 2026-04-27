'use client'
import { useState } from 'react'
import { AiRecipeCreator, type RecipeDraft } from './ai-recipe-creator'
import { RecipeForm } from './recipe-form'
import type { Category } from '@/lib/supabase/types'

interface Props {
  categories: Category[]
}

export function NuevaRecetaShell({ categories }: Props) {
  const [draft, setDraft] = useState<RecipeDraft | null>(null)
  const [draftVersion, setDraftVersion] = useState(0)

  function handleDraftReceived(d: RecipeDraft) {
    setDraft(d)
    setDraftVersion((v) => v + 1)
  }

  return (
    <>
      {/* key changes every time a new draft arrives, forcing RecipeForm to remount
          so all useState initialisers re-run with the fresh initialData */}
      <RecipeForm
        key={draftVersion}
        categories={categories}
        initialData={draft ?? undefined}
        aiSlot={
          <>
            <AiRecipeCreator onRecipeGenerated={handleDraftReceived} />
            {draft && (
              <div className="bg-green-900/30 border border-green-600 text-green-400 text-sm rounded-xl px-4 py-3 mb-6">
                ✓ Receta generada — revisa y edita los campos antes de guardar
              </div>
            )}
          </>
        }
      />
    </>
  )
}
