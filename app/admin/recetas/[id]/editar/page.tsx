import { notFound } from 'next/navigation'
import { getCategories, getRecipeByIdAdmin } from '@/lib/queries'
import { RecipeForm } from '@/components/admin/recipe-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params
  const [recipe, categories] = await Promise.all([
    getRecipeByIdAdmin(id),
    getCategories(),
  ])
  if (!recipe) notFound()
  return <RecipeForm categories={categories} recipe={recipe} />
}
