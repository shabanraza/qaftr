/**
 * Reads the text of a QR code from an image file, in the browser. Uses the
 * native BarcodeDetector where available (Chrome, Edge, Android) and falls back
 * to jsQR, loaded only when needed. Returns null when no QR code is found.
 */
type Detector = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> }
type DetectorCtor = new (opts: { formats: string[] }) => Detector

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    // the decoded image keeps its pixels; the object URL is no longer needed
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function decodeQrFromImage(file: File): Promise<string | null> {
  const img = await loadImage(file)
  const Native = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
  if (Native) {
    try {
      const found = await new Native({ formats: ['qr_code'] }).detect(img)
      if (found[0]?.rawValue) return found[0].rawValue
    } catch {
      // fall through to jsQR
    }
  }
  // Downscale large photos: jsQR is fast enough up to ~1600px.
  const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const { default: jsQR } = await import('jsqr')
  return jsQR(data, w, h, { inversionAttempts: 'attemptBoth' })?.data ?? null
}
