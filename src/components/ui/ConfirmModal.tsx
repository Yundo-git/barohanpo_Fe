"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message = "정말로 진행하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-4">{title}</h3>
          <p className="mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-main text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
