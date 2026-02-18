"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  showCloseButton?: boolean
  fullscreen?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  fullscreen = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen, onClose])

  // Handle scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`relative bg-white border-2 border-black rounded-lg shadow-lg ${
          fullscreen ? "w-full h-full m-4" : "max-w-lg w-full mx-4"
        }`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 hover:bg-gray-100 rounded p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
