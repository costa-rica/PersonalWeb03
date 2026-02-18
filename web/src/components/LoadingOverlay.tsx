"use client"

interface LoadingOverlayProps {
  isLoading: boolean
}

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative">
        {/* Spinner */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    </div>
  )
}
