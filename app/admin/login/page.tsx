'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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

        {sent ? (
          <div className="bg-accent-green rounded-2xl p-6 text-center">
            <p className="font-bold mb-1">¡Enlace enviado!</p>
            <p className="text-sm text-text-secondary">Revisa tu email y haz clic en el enlace para entrar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold tracking-widest text-primary uppercase block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pescaderotiktokero@gmail.com"
                required
                className="w-full bg-surface border border-surface-alt text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
