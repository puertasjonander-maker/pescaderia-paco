const TIKTOK_URL_REGEX = /^https:\/\/(www\.)?tiktok\.com\//

export function isValidTikTokUrl(url: string): boolean {
  return TIKTOK_URL_REGEX.test(url)
}

export interface TikTokOEmbedResult {
  title: string
  html: string
  thumbnail_url: string | null
}

export async function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbedResult> {
  if (!isValidTikTokUrl(url)) {
    throw new Error('URL no válida: debe ser de tiktok.com')
  }
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
  const res = await fetch(oembedUrl, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`TikTok oEmbed falló: ${res.status}`)
  const data = await res.json()
  return {
    title: data.title ?? '',
    html: data.html ?? '',
    thumbnail_url: data.thumbnail_url ?? null,
  }
}
