"use client";

import { useRouter } from "next/navigation";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
}: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold">로그인이 필요합니다</h3>
        <p className="text-gray-600">예약을 하시려면 로그인해주세요.</p>
        <div className="flex justify-end space-x-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            닫기
          </button>
          <button
            onClick={() => {
              router.push("/auth/");
              onClose();
            }}
            className="px-4 py-2 bg-main text-white rounded-md hover:bg-main/90"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
}
