import Image from "next/image";
import { useEffect } from "react";

interface ModalDisplayPictureProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

export default function ModalDisplayPicture({
  isOpen,
  onClose,
  src,
  alt,
}: ModalDisplayPictureProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleEsc);
    }
    return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 
        Constraints: 
        - 15% margin top/bottom -> max-height: 70vh 
        - 5% margin sides -> max-width: 90vw
      */}
      <div 
        className="relative w-[90vw] h-[90vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="90vw"
            priority
        />
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 z-50"
        aria-label="Close modal"
      >
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-8 h-8 font-mono"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
