"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Profile from "@/components/Profile";
import NicknameEditModal from "@/components/NicknameEditModal";
import { updateUser } from "@/store/userSlice";
import { toast } from "react-toastify";
import useChangeNick from "@/hooks/useChangeNick";

export default function AuthPage() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const { usenickname } = useChangeNick();

  // 모달 닫을 때 닉네임 업데이트
  const handleSaveNickname = (newNickname: string) => {
    setEditedNickname(newNickname);
    setIsModalOpen(false);
  };

  // backend에 닉네임 저장하기
  const handleSaveToBackend = async () => {
    if (!user || editedNickname === user.nickname) return;

    try {
      setIsSaving(true);

      // 1. db에 닉네임 적용하기
      const response = await usenickname(editedNickname);

      if (!response) throw new Error("Failed to update nickname");

      // 2. redux에 닉네임 적용하기
      dispatch(
        updateUser({
          user_id: user.user_id,
          nickname: editedNickname,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        })
      );

      toast.success("닉네임이 성공적으로 변경되었습니다.");
    } catch (error) {
      console.error("닉네임 변경 중 오류가 발생했습니다:", error);
      toast.error("닉네임 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-12">
      <Profile
        userId={user?.user_id || 0}
        alt="사용자 프로필"
        size={120}
        rounded="full"
        className="w-[12rem] h-[12rem] mx-auto"
      />
      <section>
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex justify-between items-center"
        >
          <p className="text-lg font-medium">
            {editedNickname || "설정되지 않음"}
          </p>
          <button>수정</button>
        </div>
      </section>

      <button
        onClick={handleSaveToBackend}
        disabled={isSaving || editedNickname === user?.nickname}
        className={`mt-4 w-full py-3 rounded-lg font-medium ${
          isSaving || editedNickname === user?.nickname
            ? "bg-gray-300 cursor-not-allowed" //변경사항 없음 비활성화
            : "bg-blue-600 text-white hover:bg-blue-700" //변경사항 생기면 활성화
        }`}
      >
        {isSaving ? "저장 중..." : "저장하기"}
      </button>
      {/* 닉네임 변경 모달 */}
      <NicknameEditModal
        isOpen={isModalOpen}
        currentNickname={user?.nickname || ""}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNickname}
      />
    </div>
  );
}
