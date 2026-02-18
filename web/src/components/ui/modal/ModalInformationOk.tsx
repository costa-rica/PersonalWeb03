"use client";

import { Button } from "@/components/ui/button";

type Variant = "info" | "success" | "error" | "warning";

interface ModalInformationOkProps {
  title: string;
  message: string;
  variant?: Variant;
  buttonText?: string;
  onClose: () => void;
  onOk?: () => void;
}

const variantStyles: Record<Variant, string> = {
  info: "bg-blue-50 border-blue-600",
  success: "bg-green-50 border-green-600",
  error: "bg-red-50 border-red-600",
  warning: "bg-yellow-50 border-yellow-600",
};

export default function ModalInformationOk({
  title,
  message,
  variant = "info",
  buttonText = "OK",
  onClose,
  onOk,
}: ModalInformationOkProps) {
  const handleOk = () => {
    if (onOk) {
      onOk();
    }
    onClose();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-mono font-bold mb-4">{title}</h2>
      <div className={`p-4 border-2 rounded-lg mb-6 ${variantStyles[variant]}`}>
        <p className="font-mono text-sm">{message}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleOk} className="font-mono">
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
