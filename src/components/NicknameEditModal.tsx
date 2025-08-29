import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NicknameEditModalProps {
  isOpen: boolean;
  currentNickname: string;
  onClose: () => void;
  onSave: (newNickname: string) => void;
}

export default function NicknameEditModal({
  isOpen,
  currentNickname,
  onClose,
  onSave,
}: NicknameEditModalProps) {
  const [nickname, setNickname] = useState(currentNickname);

  useEffect(() => {
    setNickname(currentNickname);
  }, [currentNickname]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(nickname);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold mb-4">닉네임 수정</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 w-full text-sm font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={!nickname.trim()}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
