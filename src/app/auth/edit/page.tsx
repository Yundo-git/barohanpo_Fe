// src/pages/mypage/[user_id]/page.tsx
"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { updateUser, updateProfileImage } from "@/store/userSlice";
import Profile from "@/components/auth/Profile";
import NicknameEditModal from "@/components/auth/NicknameEditModal";
import { toast } from "react-toastify";
import Image from "next/image";
import useChangeNick from "@/hooks/useChangeNick";
import axios from "axios";

interface ProfileImageState {
  file: File | null;
  isUploading: boolean;
}

export default function AuthPage() {
  const router = useRouter();
  const { user, accessToken } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const { usenickname } = useChangeNick();

  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    isUploading: false,
  });

  const profileImageUrl = useMemo(() => {
    if (user?.profileImageUrl) return user.profileImageUrl;
    if (user?.user_id)
      return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${user.user_id}/photo`;
    return "/sample_profile.svg";
  }, [user]);

  useEffect(() => {
    if (user?.nickname) {
      setEditedNickname(user.nickname);
    }
  }, [user?.nickname]);

  const handleSaveNickname = useCallback((newNickname: string) => {
    setEditedNickname(newNickname);
    setIsModalOpen(false);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setProfileImage({
      file,
      isUploading: false,
    });
  }, []);

  const handleSaveToBackend = useCallback(async () => {
    if (!user) return;

    if (editedNickname === user.nickname && !profileImage.file) {
      toast.info("변경된 내용이 없습니다.");
      return;
    }

    setIsSaving(true);
    let newImageUrl = profileImageUrl;

    try {
      // 닉네임 변경 로직
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

      // 프로필 이미지 업로드 로직 나중에 코드 정리 필요
      if (profileImage.file) {
        setProfileImage((prev) => ({ ...prev, isUploading: true }));

        const formData = new FormData();
        formData.append("file", profileImage.file);

        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${user.user_id}/photo/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status !== 200) {
          throw new Error("프로필 이미지 업로드에 실패했습니다.");
        }

        newImageUrl = response.data.data.photoUrl;

        setProfileImage({
          file: null,
          isUploading: false,
        });
      }

      // 리덕스 상태 업데이트
      dispatch(
        updateProfileImage({
          user_id: user.user_id,
          profileImageUrl: newImageUrl,
        })
      );

      setIsSuccessModalOpen(true);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "프로필 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsSaving(false);
      setProfileImage((prev) => ({ ...prev, isUploading: false }));
    }
  }, [
    user,
    editedNickname,
    accessToken,
    profileImage.file,
    dispatch,
    usenickname,
    profileImageUrl,
  ]);

  if (!user) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-5 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <Profile
            alt="프로필 사진"
            size={100}
            rounded="full"
            className="w-full h-full"
            fallbackSrc="/sample_profile.svg"
            onFileSelect={handleFileSelect}
            imageUrl={user?.profileImageUrl}
            isLoading={isSaving || profileImage.isUploading}
            version={user.profileImageVersion}
          />
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (event: Event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              };
              input.click();
            }}
            className="absolute bottom-4 right-2 text-white rounded-full"
            disabled={isSaving || profileImage.isUploading}
            title="프로필 사진 변경"
          >
            <Image src="/icon/edit.svg" alt="편집" width={34} height={34} />
          </button>
        </div>
      </div>
      {/* 여기부터 내정보 */}
      <section className="mb-4 flex flex-col gap-1">
        <p className="B2_MD_14 text-mainText">내정보</p>
        {/* 닉네임 */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center py-4 justify-between cursor-pointer hover:bg-gray-50"
        >
          <p className="B1_RG_15 text-mainText">닉네임</p>
          <p className="B1_SB_15 text-mainText">
            {editedNickname || "설정되지 않음"}
          </p>
        </div>

        {/* 이름 */}
        <div className="flex items-center py-4 justify-between">
          <p className="B1_RG_15 text-mainText">이름</p>
          <p className="B1_SB_15 text-mainText">
            {user?.name || "설정되지 않음"}
          </p>
        </div>
        {/* 전화번호 */}
        <div className="flex items-center py-4 justify-between ">
          <p className="B1_RG_15 text-mainText">전화번호</p>
          <p className="B1_SB_15 text-mainText">
            {user?.phone || "카카오로그인"}
          </p>
        </div>
        {/* 이메일 */}
        <div className="flex items-center py-4 justify-between ">
          <p className="B1_RG_15 text-mainText">이메일</p>
          <p className="B1_SB_15 text-mainText">
            {user?.email || "카카오로그인"}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <button
          onClick={handleSaveToBackend}
          disabled={
            isSaving || (editedNickname === user.nickname && !profileImage.file)
          }
          className={`w-full B1_SB_15 rounded-lg py-3 font-medium transition-colors ${
            isSaving || (editedNickname === user.nickname && !profileImage.file)
              ? "cursor-not-allowed bg-gray-300"
              : "bg-main text-white "
          }`}
        >
          {isSaving || profileImage.isUploading ? "저장 중..." : "저장하기"}
        </button>
      </div>

      <NicknameEditModal
        isOpen={isModalOpen}
        currentNickname={user.nickname}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNickname}
      />

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${
          isSuccessModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
          <h3 className="text-lg font-medium mb-4">저장 완료</h3>
          <p className="mb-6">수정사항을 저장하였습니다.</p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.push("/mypage");
              }}
              className="px-4 py-2 bg-main text-white rounded-md transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
