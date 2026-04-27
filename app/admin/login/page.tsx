'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Código incorrecto. Inténtalo de nuevo.')
      setCode('')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎣</div>
          <h1 className="text-2xl font-black">Panel Admin</h1>
          <p className="text-text-secondary text-sm mt-1">Pescadería Paco</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold tracking-widest text-primary uppercase block mb-2">
              Código de acceso
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="······"
              required
              autoFocus
              className="w-full bg-surface border border-surface-alt text-white rounded-xl px-4 py-4 text-3xl font-black text-center tracking-[0.5em] focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl disabled:opacity-60 text-lg"
          >
            {loading ? '...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
