import React from 'react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  redirectPath?: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  message = '수정사항을 저장하였습니다.',
  onClose,
  redirectPath,
  buttonText = '확인'
}) => {
  const router = useRouter();

  const handleConfirm = () => {
    onClose();
    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-medium mb-4">저장 완료</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
