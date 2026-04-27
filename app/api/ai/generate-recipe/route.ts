import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const RecipeSchema = z.object({
  title: z.string().describe('Título de la receta en español'),
  description: z.string().describe('Descripción corta y apetitosa, 1-2 frases'),
  difficulty: z.enum(['fácil', 'medio', 'difícil']).optional(),
  prep_time: z.number().int().positive().optional().describe('Minutos de preparación'),
  cook_time: z.number().int().positive().optional().describe('Minutos de cocción'),
  servings: z.number().int().positive().optional().describe('Número de personas'),
  main_fish: z
    .string()
    .optional()
    .describe(
      'Tipo de pescado/marisco principal, e.g.: lubina, dorada, merluza, gamba, pulpo, calamar, sepia, boqueron, sardina, atun, mejillon, almeja. Solo el nombre en minúscula, sin tildes.'
    ),
  category_slug: z.enum(['pescados', 'mariscos', 'arroces', 'cefalopodos', 'guisos']).optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        quantity: z
          .string()
          .describe('Solo el número o fracción, e.g.: "2", "½", "200"'),
        unit: z
          .string()
          .describe(
            'Unidad, e.g.: "kg", "g", "dientes", "cucharadas", "ml". Vacío si no aplica.'
          ),
        optional: z.boolean().default(false),
      })
    )
    .describe('Lista de ingredientes con cantidades'),
  steps: z
    .array(
      z.object({
        text: z
          .string()
          .describe('Instrucción clara del paso, máximo 3 frases'),
      })
    )
    .describe('Pasos del proceso de cocción, ordenados'),
})

const SYSTEM_PROMPT = `Eres el asistente de cocina de Pescadería Paco, una pescadería de Málaga.
Tu trabajo es extraer o crear recetas estructuradas de pescado y marisco
a partir del input que te den. Las recetas deben ser auténticas,
con ingredientes realistas y pasos claros. Habla siempre en español.
Si el input es una URL de TikTok o Instagram, usa los metadatos para
inferir qué pescado es y crea una receta apropiada para ese plato.`

async function fetchTikTokMetadata(url: string) {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('TikTok oembed failed')
  const data = await res.json() as { title?: string; author_name?: string; html?: string; thumbnail_url?: string }
  return {
    title: data.title ?? '',
    description: data.author_name ? `Por @${data.author_name}` : '',
  }
}

async function fetchInstagramMetadata(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    },
  })
  const html = await res.text()
  const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)
  const descMatch = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)
  return {
    title: titleMatch?.[1] ?? '',
    description: descMatch?.[1] ?? '',
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const adminCookie = req.cookies.get('paco_admin')
  if (adminCookie?.value !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
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

  const anthropic = createAnthropic({ apiKey })

  let userPrompt: string

  if (source === 'video') {
    let title = ''
    let description = ''

    try {
      if (content.includes('tiktok.com')) {
        const meta = await fetchTikTokMetadata(content)
        title = meta.title
        description = meta.description
      } else if (content.includes('instagram.com')) {
        const meta = await fetchInstagramMetadata(content)
        title = meta.title
        description = meta.description
      } else {
        title = content
        description = ''
      }
    } catch {
      // Fall back to URL string if metadata fetch fails
      title = content
      description = ''
    }

    userPrompt = `Analiza estos metadatos de un vídeo de receta y genera la receta estructurada:\n\nTítulo: ${title}\nDescripción: ${description}\nURL: ${content}`
  } else {
    userPrompt = `Convierte este texto en una receta estructurada:\n\n${content}`
  }

  try {
    const result = await generateObject({
      model: anthropic('claude-3-5-haiku-20241022'),
      schema: RecipeSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    return NextResponse.json(result.object)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error generating recipe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
