import { NextResponse } from 'next/server'

const DEMO_CODE = '001122'

export async function POST(request: Request) {
  const { code } = await request.json()

  if (code !== DEMO_CODE) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('paco_admin', '1', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  })
  return response
}
