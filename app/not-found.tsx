import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">🎣</div>
      <h1 className="text-2xl font-black mb-2">Página no encontrada</h1>
      <p className="text-text-secondary text-sm mb-8">
        Esta receta se la llevó la marea...
      </p>
      <Link href="/" className="bg-primary text-white font-bold px-6 py-3 rounded-xl">
        Volver al inicio
      </Link>
    </main>
  )
}
