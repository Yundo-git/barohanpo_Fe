"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import Profile from "@/components/Profile";
import NicknameEditModal from "@/components/NicknameEditModal";
import { updateUser } from "@/store/userSlice";
import { toast } from "react-toastify";
import useChangeNick from "@/hooks/useChangeNick";

export default function AuthPage() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.user.user);
  const { usenickname } = useChangeNick();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(0); // 캐시버스트용

  const handleSaveNickname = (newNickname: string) => {
    setEditedNickname(newNickname);
    setIsModalOpen(false);
  };

  // 파일 업로드
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = ""; // 같은 파일 재선택 허용
    if (!file || !user?.user_id) return;

    // 간단 검증(5MB, jpeg/png/webp)
    const okTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!okTypes.has(file.type)) {
      toast.error("jpeg/png/webp 형식만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);

      // same-origin 프록시 사용 권장: /api/users/:id/profile
      const res = await fetch(`/api/users/${user.user_id}/profile`, {
        method: "PUT",
        body: form,
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!res.ok) {
        let msg = "업로드에 실패했습니다.";
        try {
          const data = (await res.json()) as {
            error?: string;
            message?: string;
          };
          msg = data.error ?? data.message ?? msg;
        } catch {
          /* ignore */
        }
        toast.error(msg);
        return;
      }

      // 프로필 즉시 새로고침(캐시 버스트)
      setUpdatedAt(Date.now());
      toast.success("프로필 이미지가 변경되었습니다.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
      toast.error(msg);
    }
  };

  const handleSaveToBackend = async () => {
    if (!user || editedNickname === user.nickname) return;
    try {
      setIsSaving(true);
      const result = await usenickname(editedNickname);
      const newNick = result?.nickname ?? editedNickname;

      dispatch(updateUser({ nickname: newNick }));
      setEditedNickname(newNick);
      toast.success("닉네임이 성공적으로 변경되었습니다.");
    } catch (e) {
      toast.error("닉네임 변경에 실패했습니다. 다시 시도해주세요.");
      setEditedNickname(user.nickname); // 롤백
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4">
      <div className="relative w-[8.75rem] h-[8.75rem] mx-auto">
        {/* 이미지 표시만 함 */}
        <Profile
          userId={user.user_id}
          alt="사용자 프로필"
          size={140}
          rounded="full"
          className="w-full h-full"
          relativeApi
          updatedAt={updatedAt}
        />

        {/* 파일업로드 input */}
        <input
          id="profile-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="profile-file"
          className="absolute inset-0 z-50 cursor-pointer"
          aria-label="프로필 이미지 업로드"
        />
      </div>

      <section>
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-between"
        >
          <p className="text-lg font-medium">
            {editedNickname || "설정되지 않음"}
          </p>
          <button className="text-blue-600">수정</button>
        </div>
      </section>

      <button
        onClick={handleSaveToBackend}
        disabled={isSaving || editedNickname === user.nickname}
        className={`mt-2 w-full rounded-lg py-3 font-medium ${
          isSaving || editedNickname === user.nickname
            ? "cursor-not-allowed bg-gray-300"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isSaving ? "저장 중..." : "저장하기"}
      </button>

      <NicknameEditModal
        isOpen={isModalOpen}
        currentNickname={user.nickname}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNickname}
      />
    </div>
  );
}
