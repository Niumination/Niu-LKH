/**
 * Image compression utility using Canvas API
 * Resizes and compresses images to reduce base64 storage size
 */

const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const JPEG_QUALITY = 0.65

/**
 * Compress an image File to a resized, compressed base64 JPEG data URL
 * @param {File} file - The image file from file input
 * @returns {Promise<string>} Compressed base64 data URL
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    // Validate file is an image
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File must be an image'))
      return
    }

    // Validate file size (max 10MB raw)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ukuran file maksimal 10MB'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        try {
          const compressed = compressImageDataUrl(img)
          resolve(compressed)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('Gagal membaca gambar'))
      img.src = event.target.result
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an already-loaded Image element to a resized base64 JPEG
 * @param {HTMLImageElement} img - Loaded image element
 * @param {Object} [opts] - Options
 * @param {number} [opts.maxWidth=800] - Max width in pixels
 * @param {number} [opts.maxHeight=800] - Max height in pixels
 * @param {number} [opts.quality=0.65] - JPEG quality (0-1)
 * @returns {string} Compressed base64 JPEG data URL
 */
export function compressImageDataUrl(img, opts = {}) {
  const maxWidth = opts.maxWidth || MAX_WIDTH
  const maxHeight = opts.maxHeight || MAX_HEIGHT
  const quality = opts.quality != null ? opts.quality : JPEG_QUALITY

  const canvas = document.createElement('canvas')
  let { width, height } = img

  // Resize if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // White background to prevent transparency artifacts in JPEG
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Output as JPEG with reduced quality — much smaller than PNG
  const compressed = canvas.toDataURL('image/jpeg', quality)

  // Cleanup
  canvas.width = 0
  canvas.height = 0

  return compressed
}

/**
 * Estimate the storage size of a base64 data URL in KB
 * @param {string} dataUrl - Base64 data URL
 * @returns {number} Size in KB
 */
export function estimateImageSize(dataUrl) {
  if (!dataUrl) return 0
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64 = dataUrl.split(',')[1]
  if (!base64) return 0
  // Base64 is ~3/4 of byte size
  return Math.round((base64.length * 0.75) / 1024)
}
