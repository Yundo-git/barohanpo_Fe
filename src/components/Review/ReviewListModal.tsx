"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

interface ReviewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

const ReviewListModal: React.FC<ReviewListModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null;

  // Prevent click events from bubbling up to the overlay

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Close modal"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>
    </div>
  );
};

export default ReviewListModal;
