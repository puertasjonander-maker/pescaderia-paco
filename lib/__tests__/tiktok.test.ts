import { describe, it, expect } from 'vitest'
import { isValidTikTokUrl } from '../tiktok'

describe('isValidTikTokUrl', () => {
  it('accepts valid tiktok.com URLs', () => {
    expect(isValidTikTokUrl('https://www.tiktok.com/@elpescaderodemalaga/video/123')).toBe(true)
    expect(isValidTikTokUrl('https://tiktok.com/@user/video/456')).toBe(true)
  })
  it('rejects non-TikTok URLs', () => {
    expect(isValidTikTokUrl('https://evil.com/https://tiktok.com/fake')).toBe(false)
    expect(isValidTikTokUrl('https://instagram.com/reel/abc')).toBe(false)
    expect(isValidTikTokUrl('')).toBe(false)
  })
})
