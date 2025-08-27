"use client";

import { useEffect } from "react";

interface CencelModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  content: React.ReactNode;
}

const CancelModal = ({ open, onClose, title, content }: CencelModalProps) => {
  // esc로 닫기기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
        )}
        <div className="text-gray-700">
          {content}
        </div>
      </div>
    </div>
  );
};

export default CancelModal;