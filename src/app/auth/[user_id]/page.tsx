"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setAuth } from "@/store/userSlice";
import Profile from "@/components/Profile";
import useImageUpload from "@/hooks/useImageUpload";
import { PencilIcon } from "@heroicons/react/24/outline";
import NicknameEditModal from "@/components/NicknameEditModal";
import { toast } from "react-toastify";

interface UserState {
  nickname: string;
  originalNickname: string;
  name: string;
  phone: string | number;
  user_id: number;
  email: string;
  role: "user" | "admin";
  profileImage?: string;
}

export default function EditProfile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const originalUser = useSelector((state: RootState) => state.user.user);
  const accessToken = useSelector((state: RootState) => state.user.accessToken);
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [localUser, setLocalUser] = useState<UserState>({
    nickname: originalUser?.nickname || "",
    originalNickname: originalUser?.nickname || "",
    name: originalUser?.name || "",
    phone: originalUser?.phone || "",
    user_id: originalUser?.user_id || 0,
    email: originalUser?.email || "",
    role: originalUser?.role || "user",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 이미지 업로드 성공 시 사용자 정보 업데이트
  const handleUploadSuccess = useCallback(
    (imageUrl: string) => {
      if (originalUser) {
        // Get the current auth state to preserve the access token
        const currentState = (window as any).__REDUX_STATE__?.user;
        dispatch(
          setAuth({
            user: {
              ...originalUser,
              profileImage: imageUrl,
            },
            accessToken: currentState?.accessToken || "",
            refreshToken: currentState?.refreshToken,
            expiresIn: currentState?.expiresIn,
          })
        );
        setHasChanges(true);
      }
    },
    [dispatch, originalUser]
  );

  const {
    handleFileChange,
    uploadImage,
    previewUrl: profileImage,
    setPreviewUrl: setProfileImage,
    clearPreview,
    pendingFile,
    isLoading: isUploading,
  } = useImageUpload({
    initialImageUrl: originalUser?.profileImage || null,
    uploadUrl: `${API_URL}/api/users/${originalUser?.user_id}/profile/photo`,
    method: "PUT",
    fieldName: "image",
    autoUpload: false, // Disable auto upload
  });

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSaveNickname = (newNickname: string) => {
    if (newNickname.trim() !== localUser.originalNickname) {
      setLocalUser((prev) => ({
        ...prev,
        nickname: newNickname,
      }));
      setHasChanges(true);
    }
    setIsModalOpen(false);
  };

  const handleSaveToBackend = async () => {
    if (!hasChanges && !pendingFile) {
      toast.info("변경된 사항이 없습니다.");
      return;
    }

    try {
      // 1. Check authentication
      const currentUser = useSelector((state: RootState) => state.user.user);
      const currentAccessToken = useSelector(
        (state: RootState) => state.user.accessToken
      );

      if (!currentAccessToken || !currentUser) {
        throw new Error("로그인 정보가 없습니다.");
      }

      const updates: Partial<UserState> = {};

      // 2. 프로필 이미지 업로드 (변경된 경우)
      if (pendingFile) {
        const result = await uploadImage(pendingFile, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!result?.success) {
          throw new Error("프로필 이미지 업로드에 실패했습니다.");
        }

        // 프로필 이미지 URL 업데이트
        if (profileImage) {
          updates.profileImage = profileImage;
        }
      }

      // 3. 닉네임 업데이트 (변경된 경우)
      if (localUser.nickname !== localUser.originalNickname) {
        const response = await fetch(
          `${API_URL}/api/users/${originalUser?.user_id}/nickname`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ nickname: localUser.nickname }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "닉네임 변경에 실패했습니다.");
        }

        updates.nickname = localUser.nickname;
        updates.originalNickname = localUser.nickname;
      }

      // 4. 상태 업데이트
      if (Object.keys(updates).length > 0) {
        // Redux 스토어 업데이트
        if (originalUser) {
          const updatedUser = {
            ...originalUser,
            ...updates,
          };
          dispatch({ type: "user/setUser", payload: updatedUser });
        }

        // 로컬 상태 업데이트
        setLocalUser((prev) => ({
          ...prev,
          ...updates,
        }));
      }

      // 5. 성공 처리
      setHasChanges(false);
      toast.success("프로필이 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("프로필 저장 중 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "프로필 업데이트 중 오류가 발생했습니다.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 w-full h-full gap-12">
      <div className="relative group">
        <label className="cursor-pointer">
          {profileImage ? (
            <div className="relative w-[6.25rem] h-[6.25rem] rounded-full overflow-hidden">
              <img
                src={profileImage}
                alt="프로필 미리보기"
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Profile
              userId={localUser.user_id || 0}
              alt="사용자 프로필"
              size={100}
              rounded="full"
              className="w-[6.25rem] h-[6.25rem] hover:opacity-90 transition-opacity"
            />
          )}
          <input
            type="file"
            accept="image/jpeg, image/png"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </label>
      </div>

      <section className="w-full">
        <h1>내정보</h1>
        <div className="flex justify-between">
          <p>닉네임</p>
          <div
            onClick={handleOpenModal}
            className="flex items-center gap-2 cursor-pointer "
          >
            <p>{localUser.nickname}</p>
            <PencilIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <NicknameEditModal
          isOpen={isModalOpen}
          currentNickname={localUser.nickname}
          onClose={handleCloseModal}
          onSave={handleSaveNickname}
        />
        <div className="flex justify-between">
          <p>이름</p>
          <p>{localUser.name}</p>
        </div>
        <div className="flex justify-between">
          <p>성별</p>
          <p>{localUser.user_id}</p>
        </div>
        <div className="flex justify-between">
          <p>전화번호</p>
          <p>{localUser.phone}</p>
        </div>
        <div className="flex justify-between">
          <p>이메일</p>
          <p>{localUser.email}</p>
        </div>
      </section>

      <button
        onClick={handleSaveToBackend}
        disabled={!hasChanges}
        className={`w-full py-3 rounded-md ${
          hasChanges
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        저장하기
      </button>
    </div>
  );
}
