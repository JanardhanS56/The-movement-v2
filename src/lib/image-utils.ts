/**
 * Utility functions for client-side image processing.
 * Drawing images onto an HTML5 Canvas and exporting via toDataURL
 * naturally strips all EXIF, GPS, camera, and device metadata.
 */

export interface ResizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: string
}

/**
 * Re-encode an image file through an HTML5 canvas to strip EXIF/GPS metadata
 * and resize to target dimensions.
 */
export async function reencodeImage(
  file: File,
  options: ResizeImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.85,
    mimeType = "image/jpeg",
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to decode image"))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"))
          return
        }

        // Draw clean image onto canvas (all EXIF/GPS stripped)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL(mimeType, quality)
        resolve(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Crop and square re-encode an image to an exact 512x512 square data URL.
 * Strips all EXIF/GPS metadata.
 */
export async function cropSquareImage(
  file: File,
  size = 512,
  zoom = 1,
  offsetX = 0,
  offsetY = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to decode image"))
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"))
          return
        }

        // Compute aspect fill
        const minDim = Math.min(img.width, img.height)
        const sourceWidth = minDim / zoom
        const sourceHeight = minDim / zoom
        const sourceX = (img.width - sourceWidth) / 2 + offsetX
        const sourceY = (img.height - sourceHeight) / 2 + offsetY

        ctx.drawImage(
          img,
          Math.max(0, sourceX),
          Math.max(0, sourceY),
          sourceWidth,
          sourceHeight,
          0,
          0,
          size,
          size
        )

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
        resolve(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
