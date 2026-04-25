'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    if (error) {
      setError('Código incorrecto o expirado. Inténtalo de nuevo.')
    } else {
      router.push('/admin')
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

        {!sent ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
              {loading ? 'Enviando...' : 'Enviar código de acceso'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="bg-accent-green rounded-2xl p-4 text-center mb-2">
              <p className="font-bold text-sm">¡Código enviado!</p>
              <p className="text-xs text-text-secondary mt-1">Revisa tu email e introduce el código de 6 dígitos.</p>
            </div>
            <div>
              <label className="text-xs font-bold tracking-widest text-primary uppercase block mb-2">
                Código
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full bg-surface border border-surface-alt text-white rounded-xl px-4 py-3 text-2xl font-black text-center tracking-widest focus:outline-none focus:border-primary"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl disabled:opacity-60"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(''); setError(null) }}
              className="w-full text-text-secondary text-sm py-2"
            >
              Volver a enviar
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
