'use client'
import { FISH_CATALOG } from '@/lib/fish-catalog'

interface FishFilterProps {
  selected: string | null
  onChange: (fishId: string | null) => void
}

export function FishFilter({ selected, onChange }: FishFilterProps) {
  return (
    <div className="-mx-4 px-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* All option */}
      <button
        onClick={() => onChange(null)}
        className={`flex-none flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
          selected === null
            ? 'bg-primary text-white'
            : 'bg-surface-alt text-text-secondary hover:text-white'
        }`}
      >
        <span className="text-xl">🎣</span>
        <span className="text-sm font-bold whitespace-nowrap">Todos</span>
      </button>

      {FISH_CATALOG.map((fish) => {
        const isSelected = selected === fish.id
        return (
          <button
            key={fish.id}
            onClick={() => onChange(fish.id)}
            className={`flex-none flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
              isSelected
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-white'
            }`}
          >
            <span className="text-xl">{fish.emoji}</span>
            <span className="text-sm font-bold whitespace-nowrap">{fish.name}</span>
          </button>
        )
      })}
    </div>
  )
}
