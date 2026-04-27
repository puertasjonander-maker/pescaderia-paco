export interface FishEntry {
  id: string      // matches main_fish value in DB (e.g. 'lubina')
  name: string    // display name (e.g. 'Lubina')
  emoji: string
  description: string
}

export const FISH_CATALOG: FishEntry[] = [
  { id: 'lubina',   name: 'Lubina',      emoji: '🐟', description: 'Dorada, jugosa y versátil' },
  { id: 'dorada',   name: 'Dorada',      emoji: '🐡', description: 'Sabor suave y textura firme' },
  { id: 'merluza',  name: 'Merluza',     emoji: '🐠', description: 'El pescado más querido de España' },
  { id: 'gamba',    name: 'Gambas',      emoji: '🦐', description: 'Frescas del día, del mar a la mesa' },
  { id: 'pulpo',    name: 'Pulpo',       emoji: '🐙', description: 'Tierno por dentro, crujiente por fuera' },
  { id: 'calamar',  name: 'Calamar',     emoji: '🦑', description: 'Fresco y de temporada' },
  { id: 'boqueron', name: 'Boquerón',    emoji: '🐟', description: 'El pescaíto frito malagueño' },
  { id: 'sepia',    name: 'Sepia',       emoji: '🦑', description: 'Sabor intenso a mar' },
  { id: 'sardina',  name: 'Sardinas',    emoji: '🐟', description: 'Espeto malagueño en su salsa' },
  { id: 'atun',     name: 'Atún',        emoji: '🐠', description: 'El rey del mar, versátil y potente' },
]
