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
  const MAX_LEN = 6;
  const [nickname, setNickname] = useState(currentNickname);

  useEffect(() => {
    setNickname(currentNickname);
  }, [currentNickname]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onSave(nickname.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative">
        <h2 className="text-xl font-bold mb-2 text-center">닉네임 수정</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          변경할 닉네임을 입력해주세요
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, MAX_LEN))}
              className="w-full p-4 border border-gray-200 rounded-xl text-center text-lg focus:ring-2 focus:ring-main focus:border-transparent"
              placeholder="닉네임을 입력해주세요"
              maxLength={MAX_LEN}
              autoFocus
            />
            <div className="mt-2 text-xs text-gray-500 text-center">
              최대 {MAX_LEN}자 (현재 {nickname.length}/{MAX_LEN})
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-full py-4 bg-main disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2"
            >
              확인
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
