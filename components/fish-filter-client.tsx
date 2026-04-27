'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { FishFilter } from '@/components/fish-filter'

interface FishFilterClientProps {
  selected: string | null
}

export function FishFilterClient({ selected }: FishFilterClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(fishId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (fishId === null) {
      params.delete('pez')
    } else {
      params.set('pez', fishId)
    }
    router.push(`/recetas?${params.toString()}`)
  }

  return <FishFilter selected={selected} onChange={handleChange} />
}
