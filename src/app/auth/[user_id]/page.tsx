"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { updateProfileImage, updateUser } from "@/store/userSlice";
import Profile from "@/components/auth/Profile";
import NicknameEditModal from "@/components/auth/NicknameEditModal";
import SuccessModal from "@/components/reservation/SuccessModal";
import useChangeNick from "@/hooks/useChangeNick";
import useImageUpload from "@/hooks/useImageUpload";

// Mock toast function since the actual hook is missing
const toast = {
  success: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
  info: (message: string) => console.info(message),
};

export default function AuthPage() {
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch<AppDispatch>();
  const { usenickname } = useChangeNick();

  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  // 프로필 이미지 업로드 훅 사용 (단일 이미지 모드로 설정)
  // 이미지 업로드 상태 관리
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [_imageError, setImageError] = useState<string | null>(null);

  // useImageUpload 훅을 사용하여 이미지 업로드 로직 처리 (단일 이미지 모드)
  const { images, handleFileChange, removeImage, isUploading } = useImageUpload(
    {
      singleImage: true,
      initialImages: user?.profileImage ? [user.profileImage] : [],
      maxFiles: 1,
    }
  );

  // Handle image removal - currently not used but kept for future use
  const _handleRemoveImage = useCallback(() => {
    if (images[0]?.id) {
      removeImage(images[0].id);
    }
    setImageError(null);
  }, [removeImage, images]);

  // 이미지 업로드 상태 동기화
  useEffect(() => {
    setIsUploadingImage(isUploading);
  }, [isUploading]);

  // 프로필 이미지 URL 생성 (버전 파라미터 추가하여 캐시 방지)
  const _profileImageUrl = useMemo(() => {
    // If we have a preview URL (newly uploaded image), use it
    if (images.length > 0 && images[0].previewUrl) {
      return images[0].previewUrl;
    }

    // If we have a profile image from the user object
    if (user?.profileImage) {
      // Check if it's already a full URL
      if (user.profileImage.startsWith("http")) {
        return user.profileImage;
      }
      // Otherwise, construct the full URL
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const separator = user.profileImage.includes("?") ? "&" : "?";
      return `${baseUrl}${user.profileImage}${separator}v=${
        user.profileImageVersion || Date.now()
      }`;
    }

    // Fallback to default image
    return "/sample_profile.svg";
  }, [user?.profileImage, user?.profileImageVersion, images]);

  useEffect(() => {
    if (user?.nickname) {
      setEditedNickname(user.nickname);
    }
  }, [user?.nickname]);

  // 프로필 이미지 제출 핸들러
  const handleProfileImageSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !images.length || !images[0].file) return;

      setIsSaving(true);
      setImageError(null);

      try {
        const formData = new FormData();
        formData.append("file", images[0].file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${user.user_id}/photo/upload`,
          {
            method: "PUT",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "프로필 이미지 업로드에 실패했습니다."
          );
        }

        const { url } = await response.json();
        const timestamp = Date.now();

        // 프로필 이미지 업데이트
        dispatch(
          updateProfileImage({
            user_id: user.user_id,
            profileImageVersion: timestamp,
            profileImageUrl: url,
          })
        );

        // 성공 알림
        toast.success("프로필 이미지가 성공적으로 업데이트되었습니다.");
      } catch (error) {
        console.error("프로필 이미지 업로드 중 오류 발생:", error);
        setImageError(
          error instanceof Error
            ? error.message
            : "이미지 업로드 중 오류가 발생했습니다."
        );

        // 에러 발생 시 이미지 초기화
        if (images.length > 0) {
          removeImage(images[0].id);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [images, user, dispatch, removeImage]
  );

  // 닉네임 변경
  const handleSaveNickname = useCallback((newNickname: string) => {
    setEditedNickname(newNickname);
    setIsModalOpen(false);
  }, []);

  //백엔드에 전송
  const handleSaveToBackend = useCallback(async () => {
    if (!user || !dispatch) return;

    if (editedNickname === user.nickname && !images.length) {
      toast.info("변경된 내용이 없습니다.");
      return;
    }

    setIsSaving(true);

    try {
      // 닉네임 변경
      if (editedNickname !== user.nickname) {
        await usenickname(editedNickname);
        dispatch(
          updateUser({
            user_id: user.user_id,
            nickname: editedNickname,
          })
        );
        toast.success("닉네임이 변경되었습니다.");
      }

      if (images.length && images[0]?.file) {
        await handleProfileImageSubmit(
          new Event("submit") as unknown as React.FormEvent
        );
      }

      // 성공 모달 표시
      setIsSuccessModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    editedNickname,
    images,
    dispatch,
    usenickname,
    handleProfileImageSubmit,
  ]);

  if (!user) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32">
          <Profile
            userId={user.user_id}
            version={user.profileImageVersion}
            alt={`${user.nickname}님의 프로필`}
            size={128}
            rounded="full"
            className="w-full h-full border-2 border-gray-200"
            onFileSelect={(file) => {
              const event = {
                target: {
                  files: [file],
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileChange(event);
            }}
            src={images[0]?.previewUrl}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="text-blue-600">
          수정
        </button>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleSaveToBackend}
          disabled={
            isSaving ||
            (editedNickname === user.nickname && images.length === 0)
          }
          className={`w-full rounded-lg py-3 font-medium transition-colors ${
            isSaving ||
            (editedNickname === user.nickname && images.length === 0)
              ? "cursor-not-allowed bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSaving || isUploadingImage ? "저장 중..." : "저장하기"}
        </button>
      </div>

      <NicknameEditModal
        isOpen={isModalOpen}
        currentNickname={user.nickname}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNickname}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        redirectPath="/mypage"
      />
    </div>
  );
}
