import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTikTokOEmbed, isValidTikTokUrl } from '@/lib/tiktok'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const url = (body as { url?: unknown }).url
  if (typeof url !== 'string' || !isValidTikTokUrl(url)) {
    return NextResponse.json({ error: 'URL de TikTok no válida' }, { status: 400 })
  }

  try {
    const result = await fetchTikTokOEmbed(url)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'No se pudo obtener el vídeo de TikTok' },
      { status: 502 }
    )
  }
}
