import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// ── JSON schema description embedded in the prompt ────────────────────────────
const JSON_SCHEMA = `{
  "title": "string — título de la receta en español",
  "description": "string — descripción corta y apetitosa, 1-2 frases",
  "difficulty": "fácil" | "medio" | "difícil" | null,
  "prep_time": number | null,   // minutos de preparación
  "cook_time": number | null,   // minutos de cocción
  "servings": number | null,    // número de personas
  "main_fish": "string | null — pescado/marisco principal en minúscula sin tildes, e.g.: lubina, dorada, merluza, gamba, pulpo, calamar, sepia, boqueron, sardina, atun, mejillon, almeja, pintarroja",
  "category_slug": "pescados" | "mariscos" | "arroces" | "cefalopodos" | "guisos" | null,
  "ingredients": [
    {
      "name": "string",
      "quantity": "string — solo el número o fracción, e.g.: '2', '½', '200'",
      "unit": "string — unidad, e.g.: 'kg', 'g', 'dientes', 'cucharadas', 'ml'. Vacío si no aplica.",
      "optional": boolean
    }
  ],
  "steps": [
    { "text": "string — instrucción clara del paso, máximo 3 frases" }
  ]
}`

const SYSTEM_PROMPT = `Eres el asistente de cocina de Pescadería Paco, una pescadería de Málaga.
Tu trabajo es extraer recetas estructuradas de pescado y marisco a partir del input.
Responde SIEMPRE y ÚNICAMENTE con un objeto JSON válido que siga exactamente este esquema:

${JSON_SCHEMA}

Sin texto adicional, sin markdown, sin bloques de código. Solo el JSON puro.`

// ── Metadata fetchers ─────────────────────────────────────────────────────────

async function fetchTikTokMetadata(url: string) {
  // Strip tracking params so oEmbed doesn't reject them
  const cleanUrl = url.split('?')[0]
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`)
  if (!res.ok) throw new Error(`TikTok oEmbed failed: ${res.status}`)
  const data = await res.json() as {
    title?: string
    author_name?: string
    thumbnail_url?: string
  }
  // TikTok puts the FULL video caption (often the whole recipe) in `title`
  return {
    caption: data.title ?? '',
    author: data.author_name ?? '',
  }
}

async function fetchInstagramMetadata(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    },
  })
  const html = await res.text()
  const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)
  const descMatch  = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)
  return {
    caption: descMatch?.[1] ?? titleMatch?.[1] ?? '',
    author: '',
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get('paco_admin')
  if (adminCookie?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { source, content } = body as { source?: string; content?: string }
  if (!source || !content) {
    return NextResponse.json({ error: 'Missing source or content' }, { status: 400 })
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  })

  // ── Build user prompt ────────────────────────────────────────────────────
  let userPrompt: string

  if (source === 'video') {
    let caption = ''
    let author  = ''

    try {
      if (content.includes('tiktok.com')) {
        const meta = await fetchTikTokMetadata(content)
        caption = meta.caption
        author  = meta.author
      } else if (content.includes('instagram.com')) {
        const meta = await fetchInstagramMetadata(content)
        caption = meta.caption
        author  = meta.author
      } else {
        caption = content
      }
    } catch {
      caption = content
    }

    userPrompt = [
      'Extrae la receta de este vídeo de cocina y genera el JSON estructurado.',
      author  ? `Autor: @${author}` : '',
      caption ? `\nContenido del vídeo:\n${caption}` : `\nURL: ${content}`,
    ].filter(Boolean).join('\n')
  } else {
    userPrompt = `Convierte este texto en una receta estructurada y genera el JSON:\n\n${content}`
  }

  // ── Call Claude via OpenRouter with plain generateText ───────────────────
  try {
    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-haiku'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    // Strip any accidental markdown fences just in case
    const clean = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const recipe = JSON.parse(clean)

    return NextResponse.json(recipe)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error generating recipe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
