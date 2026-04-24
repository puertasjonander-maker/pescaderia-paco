import Link from 'next/link'
import { getAllRecipesAdmin } from '@/lib/queries'

export default async function AdminPage() {
  const recipes = await getAllRecipesAdmin()

  return (
    <main className="px-4 pt-8 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black">Recetas</h1>
        <Link
          href="/admin/recetas/nueva"
          className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-xl"
        >
          + Nueva
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-12">No hay recetas todavía.</p>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-surface rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{recipe.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    recipe.published ? 'bg-accent-green text-green-300' : 'bg-surface-alt text-text-secondary'
                  }`}>
                    {recipe.published ? 'Publicada' : 'Borrador'}
                  </span>
                </div>
              </div>
              <Link
                href={`/admin/recetas/${recipe.id}/editar`}
                className="text-primary text-sm font-bold"
              >
                Editar →
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
