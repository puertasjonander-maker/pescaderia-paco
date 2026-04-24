interface TikTokEmbedProps {
  embedHtml: string | null
  tiktokUrl: string
}

export function TikTokEmbed({ embedHtml, tiktokUrl }: TikTokEmbedProps) {
  if (!embedHtml) {
    return (
      <div className="bg-surface-alt rounded-2xl p-6 text-center">
        <p className="text-text-secondary text-sm mb-3">Vídeo no disponible</p>
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-bold"
        >
          Ver en TikTok →
        </a>
      </div>
    )
  }

  return (
    <div
      className="tiktok-embed-container flex justify-center"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  )
}
