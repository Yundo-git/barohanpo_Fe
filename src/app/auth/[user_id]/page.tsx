"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { updateUser, updateProfileImage } from "@/store/userSlice";
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

interface ProfileImageState {
  file: File | null;
  previewUrl: string;
  isUploading: boolean;
}

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
  const [imageError, setImageError] = useState<string | null>(null);

  // useImageUpload 훅을 사용하여 이미지 업로드 로직 처리 (단일 이미지 모드)
  const {
    images,
    handleFileChange,
    removeImage,
    resetImages,
    isUploading,
    error: uploadError,
  } = useImageUpload({
    singleImage: true,
    initialImages: user?.profileImage ? [user.profileImage] : [],
    maxFiles: 1,
  });

  // 이미지 업로드 상태 동기화
  useEffect(() => {
    setIsUploadingImage(isUploading);
  }, [isUploading]);

  // 프로필 이미지 URL 생성 (버전 파라미터 추가하여 캐시 방지)
  const profileImageUrl = useMemo(() => {
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

      // 현재 선택된 이미지 가져오기
      const currentFile = images[0]?.file;

      // 이미지가 선택되지 않았거나 업로드 중인 경우 제출 방지
      if (!currentFile || isUploadingImage) {
        if (!currentFile) {
          toast.info("변경할 이미지를 선택해주세요.");
        }
        return;
      }

      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("file", currentFile);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${user?.user_id}/photo/upload`,
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
        if (user?.user_id) {
          dispatch(
            updateProfileImage({
              user_id: user.user_id,
              profileImageVersion: timestamp,
              profileImageUrl: url,
            })
          );
        }

        // 성공 알림
        toast.success("프로필 이미지가 성공적으로 업데이트되었습니다.");

        // 이미지 초기화 (성공 시에만)
        resetImages();
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
        setIsUploadingImage(false);
      }
    },
    [
      images,
      isUploadingImage,
      user?.user_id,
      dispatch,
      resetImages,
      removeImage,
    ]
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

      if (images.length) {
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
            imageUrl={profileImageUrl}
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
            isLoading={isUploadingImage || isUploading}
            version={user.profileImageVersion}
            // fallbackSrc="/sample_profile.svg"
          />
        </div>

        <button
          onClick={() => document.getElementById("profile-file")?.click()}
          className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={isSaving || isUploadingImage || isUploading}
        >
          프로필 사진 변경
        </button>

        <input
          type="file"
          id="profile-file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            // 에러 초기화 (useState 대신 useImageUpload의 setError 사용)
            // Note: useImageUpload의 setError가 없다면, 이 부분을 수정해야 할 수 있습니다.
            // setImageError(null);
            handleFileChange(e);
          }}
          className="hidden"
          disabled={isSaving || isUploadingImage || isUploading}
        />
      </div>

      <section className="mb-8">
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <div>
            <p className="text-sm text-gray-500">닉네임</p>
            {isUploadingImage ? (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-sm text-gray-500">
                  이미지 업로드 중...
                </span>
              </div>
            ) : imageError ? (
              <p className="mt-1 text-sm text-red-500">{imageError}</p>
            ) : null}
            <p className="text-lg font-medium">
              {editedNickname || "설정되지 않음"}
            </p>
          </div>
          <button className="text-blue-600">수정</button>
        </div>
      </section>

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
          {isSaving || isUploading ? "저장 중..." : "저장하기"}
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
