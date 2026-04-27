import { getCategories } from '@/lib/queries'
import { NuevaRecetaShell } from '@/components/admin/nueva-receta-shell'

export default async function NewRecipePage() {
  const categories = await getCategories()
  return <NuevaRecetaShell categories={categories} />
}
