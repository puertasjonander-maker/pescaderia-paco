import { getCategories } from '@/lib/queries'
import { RecipeForm } from '@/components/admin/recipe-form'

export default async function NewRecipePage() {
  const categories = await getCategories()
  return <RecipeForm categories={categories} />
}
