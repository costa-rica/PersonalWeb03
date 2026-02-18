"use client";

import { Button } from "@/components/ui/button";

type YesButtonStyle = "danger" | "primary";

interface ModalInformationYesOrNoProps {
  title: string;
  message: string;
  onYes: () => void;
  onClose: () => void;
  yesButtonText?: string;
  noButtonText?: string;
  yesButtonStyle?: YesButtonStyle;
}

export default function ModalInformationYesOrNo({
  title,
  message,
  onYes,
  onClose,
  yesButtonText = "Yes",
  noButtonText = "No",
  yesButtonStyle = "primary",
}: ModalInformationYesOrNoProps) {
  const handleYes = () => {
    onYes();
    onClose();
  };

  const handleNo = () => {
    onClose();
  };

  const yesButtonClass =
    yesButtonStyle === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-black hover:bg-gray-800 text-white";

  return (
    <div className="p-6">
      <h2 className="text-2xl font-mono font-bold mb-4">{title}</h2>
      <div className="p-4 border-2 border-black rounded-lg mb-6 bg-gray-50">
        <p className="font-mono text-sm">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleNo}
          className="font-mono bg-gray-400 hover:bg-gray-500 text-white"
        >
          {noButtonText}
        </Button>
        <Button onClick={handleYes} className={`font-mono ${yesButtonClass}`}>
          {yesButtonText}
        </Button>
      </div>
    </div>
  );
}
