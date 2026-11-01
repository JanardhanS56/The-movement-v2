"use client"

import * as React from "react"
import { Upload, ZoomIn, ZoomOut, RotateCcw, X, Check, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cropSquareImage } from "@/lib/image-utils"
import { Button } from "@/components/ui/button"

export interface PhotoCropDialogProps {
  isOpen: boolean
  onClose: () => void
  onSavePhoto: (dataUrl: string) => void
  userName: string
}

export function PhotoCropDialog({
  isOpen,
  onClose,
  onSavePhoto,
  userName,
}: PhotoCropDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Reset state on open/close
  React.useEffect(() => {
    if (!isOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setSelectedFile(null)
      setPreviewUrl(null)
      setZoom(1)
      setIsProcessing(false)
    }
  }, [isOpen, previewUrl])

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid JPEG, PNG, or WebP photo.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file exceeds the 5 MB limit.")
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setZoom(1)
  }

  const handleConfirmCrop = async () => {
    if (!selectedFile) return

    try {
      setIsProcessing(true)
      const croppedDataUrl = await cropSquareImage(selectedFile, 512, zoom)
      onSavePhoto(croppedDataUrl)
      toast.success("Profile photo updated. EXIF & location data stripped.")
      onClose()
    } catch {
      toast.error("Failed to process profile photo.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-chunky border-2 border-ink shadow-2xl p-5 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
          <div>
            <h3 id="photo-crop-dialog-title" className="font-sans font-black text-lg text-ink">
              Change profile photo
            </h3>
            <p className="text-xs text-ink/60 mt-0.5">
              Square crop for {userName}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1 text-ink/50 hover:text-ink transition-colors rounded-xs hover:bg-ivory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload or Preview Area */}
        <div className="space-y-4">
          {!previewUrl ? (
            <div className="p-8 border-2 border-dashed border-ink/30 rounded-chunky text-center space-y-3 bg-ivory/50">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-ink flex items-center justify-center mx-auto text-ink/60">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">
                  Upload JPEG, PNG, or WebP
                </p>
                <p className="text-[11px] text-ink/50 mt-0.5">Maximum file size: 5 MB</p>
              </div>

              <input
                type="file"
                id="profile-file-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="profile-file-input"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-lime text-ink border-2 border-ink text-xs font-black shadow-hard-xs hover:bg-lime/90 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose photo</span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Square Crop Viewport */}
              <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-ink shadow-hard-xs bg-ivory flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={`Crop preview for ${userName}`}
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.1s ease-out",
                  }}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1.5 px-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink/70">
                  <span className="flex items-center gap-1">
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom out</span>
                  </span>
                  <span className="tabular-nums font-mono text-[11px]">
                    {Math.round(zoom * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom in</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-cobalt cursor-pointer"
                  aria-label="Image zoom level"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (previewUrl) URL.revokeObjectURL(previewUrl)
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setZoom(1)
                  }}
                  className="text-xs border-2 border-ink text-ink gap-1 h-8"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Choose different photo</span>
                </Button>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-2.5 rounded-sm bg-ivory border border-ink/15 text-[11px] text-ink/70 leading-relaxed">
            <span className="font-bold text-ink">Privacy notice:</span> Photos are re-encoded through canvas to strip EXIF and location data. Stored only in this browser in the demo.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t-2 border-ink/10 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-2 border-ink text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedFile || isProcessing}
            onClick={handleConfirmCrop}
            className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink font-black text-xs shadow-hard-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isProcessing ? "Processing..." : "Save photo"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
