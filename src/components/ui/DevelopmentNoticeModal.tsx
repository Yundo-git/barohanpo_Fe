"use client";

interface DevelopmentNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
}

export default function DevelopmentNoticeModal({
  isOpen,
  onClose,
  title = "알림",
  message = "해당 기능 개발 중입니다",
  confirmText = "확인",
}: DevelopmentNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
          <p className="mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-main text-white py-2 px-4 rounded-md "
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
