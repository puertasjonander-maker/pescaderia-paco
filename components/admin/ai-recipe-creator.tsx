'use client'
import { useState, useRef, useEffect } from 'react'

export interface RecipeDraft {
  title: string
  description?: string
  difficulty?: string
  prep_time?: number
  cook_time?: number
  servings?: number
  main_fish?: string
  category_slug?: string
  ingredients: Array<{ name: string; quantity: string; unit: string; optional: boolean }>
  steps: Array<{ text: string }>
}

interface Props {
  onRecipeGenerated: (draft: RecipeDraft) => void
}

type Tab = 'video' | 'voice' | 'text'

export function AiRecipeCreator({ onRecipeGenerated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('video')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Video tab state
  const [videoUrl, setVideoUrl] = useState('')

  // Voice tab state
  const [transcript, setTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Text tab state
  const [textContent, setTextContent] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
      if (!SR) {
        setSpeechAvailable(false)
      }
    }
  }, [])

  function startRecording() {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscript = ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      setTranscript(finalTranscript + interimTranscript)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    setTranscript('')
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  async function callApi(source: 'video' | 'voice' | 'text', content: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, content }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Error generando receta')
      }
      const draft = await res.json() as RecipeDraft
      onRecipeGenerated(draft)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'video', label: 'Vídeo' },
    { id: 'voice', label: 'Voz' },
    { id: 'text', label: 'Texto' },
  ]

  return (
    <div className="bg-surface rounded-2xl p-5 mb-6">
      <p className="text-xs font-bold tracking-widest uppercase text-text-secondary mb-3">
        CREAR CON IA
      </p>

      {/* Tab bar */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface-alt text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Interpretando receta...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Video tab */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@elpescaderodemalaga/video/... o https://www.instagram.com/p/..."
                className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => callApi('video', videoUrl)}
                disabled={loading || !videoUrl.trim()}
                className="bg-primary text-white font-bold text-sm px-4 py-3 rounded-xl disabled:opacity-50"
              >
                Analizar vídeo
              </button>
            </div>
          )}

          {/* Voice tab */}
          {activeTab === 'voice' && (
            <div className="space-y-3">
              {!speechAvailable ? (
                <p className="text-text-secondary text-sm">
                  Grabación de voz disponible en Chrome y Safari
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                      isRecording
                        ? 'border-2 border-red-400 text-red-400 bg-transparent animate-pulse'
                        : 'bg-surface-alt text-text-secondary'
                    }`}
                  >
                    <span>🎤</span>
                    <span>
                      {isRecording
                        ? 'Grabando... (toca para parar)'
                        : 'Iniciar grabación'}
                    </span>
                  </button>

                  {transcript && (
                    <textarea
                      readOnly
                      value={transcript}
                      rows={4}
                      className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none resize-none"
                    />
                  )}

                  {transcript && !isRecording && (
                    <button
                      type="button"
                      onClick={() => callApi('voice', transcript)}
                      disabled={loading}
                      className="bg-primary text-white font-bold text-sm px-4 py-3 rounded-xl disabled:opacity-50"
                    >
                      Crear receta
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Text tab */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                placeholder="Pega aquí cualquier texto de una receta: instrucciones, lista de ingredientes, descripción de un plato... La IA lo formatea como receta."
                className="w-full bg-surface-alt text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => callApi('text', textContent)}
                disabled={loading || !textContent.trim()}
                className="bg-primary text-white font-bold text-sm px-4 py-3 rounded-xl disabled:opacity-50"
              >
                Crear receta
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  )
}
