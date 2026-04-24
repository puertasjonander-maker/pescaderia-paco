import { notFound } from 'next/navigation'
import { getRecipeBySlug } from '@/lib/queries'
import { CookMode } from '@/components/cook-mode'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CookPage({ params }: Props) {
  const { slug } = await params
  const recipe = await getRecipeBySlug(slug)

  if (!recipe || recipe.steps.length === 0) notFound()

  return <CookMode recipe={recipe} recipeSlug={slug} />
}
