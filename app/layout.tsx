// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pescadería Paco — Recetas del Mar',
  description: 'Recetas de pescado y marisco por Fran, el Pescadero Tiktokero de Málaga.',
  openGraph: {
    siteName: 'Pescadería Paco',
    locale: 'es_ES',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
