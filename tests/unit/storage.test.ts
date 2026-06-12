import { describe, it, expect } from 'vitest'
import { mimeTypeForFile } from '@/lib/services/storage'

describe('mimeTypeForFile', () => {
  it.each([
    ['.pdf', 'application/pdf'],
    ['.doc', 'application/msword'],
    ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.webp', 'image/webp'],
    ['.mp4', 'video/mp4'],
    ['.mov', 'video/quicktime'],
  ])('returns correct MIME for %s', (ext, expected) => {
    expect(mimeTypeForFile(`file${ext}`)).toBe(expected)
  })

  it('returns application/octet-stream for unknown extension', () => {
    expect(mimeTypeForFile('file.xyz')).toBe('application/octet-stream')
  })

  it('handles uppercase extensions case-insensitively', () => {
    expect(mimeTypeForFile('file.PDF')).toBe('application/pdf')
    expect(mimeTypeForFile('file.JPG')).toBe('image/jpeg')
  })

  it('handles filenames with multiple dots', () => {
    expect(mimeTypeForFile('my.report.final.pdf')).toBe('application/pdf')
  })
})
