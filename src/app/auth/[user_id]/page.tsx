"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { updateUser } from "@/store/userSlice";
import Profile from "@/components/Profile";
import NicknameEditModal from "@/components/NicknameEditModal";
import { toast } from "react-toastify";
import useChangeNick from "@/hooks/useChangeNick";

interface ProfileImageState {
  file: File | null;
  previewUrl: string;
  isUploading: boolean;
}

export default function AuthPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.user_id as string;
  const user = useAppSelector((state) => state.user.user);
  const dispatch = useAppDispatch();
  const { usenickname } = useChangeNick();

  // Local state for form inputs
  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>();
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    previewUrl: "",
    isUploading: false,
  });

  // Update local state when user changes
  useEffect(() => {
    if (user?.nickname) {
      setEditedNickname(user.nickname);
    }
  }, [user?.nickname]);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage((prev) => ({
        ...prev,
        file,
        previewUrl: reader.result as string,
        isUploading: false,
      }));
    };
    reader.onerror = () => {
      toast.error("이미지 파일을 읽을 수 없습니다.");
      setProfileImage((prev) => ({ ...prev, isUploading: false }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        const file = e.target.files?.[0];
        e.currentTarget.value = ""; // Allow re-selecting the same file
        if (!file || !user?.user_id) return;

        // Simple validation (5MB, jpeg/png/webp)
        const okTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!okTypes.has(file.type)) {
          toast.error("JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("이미지 크기는 5MB 이하로 업로드해주세요.");
          return;
        }

        handleFileSelect(file);
      },
      [user?.user_id, handleFileSelect]
    );

  const handleSaveNickname = useCallback((newNickname: string) => {
    setEditedNickname(newNickname);
    setIsModalOpen(false);
  }, []);

  const handleSaveToBackend = useCallback(async () => {
    if (!user) return;

    // Check if there are any changes
    if (editedNickname === user.nickname && !profileImage.file) {
      toast.info("변경된 내용이 없습니다.");
      return;
    }

    setIsSaving(true);

    try {
      // Update nickname if changed
      if (editedNickname !== user.nickname) {
        await usenickname(editedNickname);
        dispatch(updateUser({ 
          user_id: user.user_id,
          nickname: editedNickname 
        }));
        toast.success("닉네임이 변경되었습니다.");
      }

      // Upload profile image if selected
      if (profileImage.file) {
        setProfileImage((prev) => ({ ...prev, isUploading: true }));

        const formData = new FormData();
        formData.append("file", profileImage.file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/${user.user_id}/photo/upload`,
          {
            method: "PUT",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("프로필 이미지 업로드에 실패했습니다.");
        }

        // Update the image preview
        setUpdatedAt(Date.now());
        setProfileImage((prev) => ({
          ...prev,
          file: null,
          isUploading: false,
        }));
      }

      // Show success modal
      setIsSuccessModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "프로필 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [user, editedNickname, profileImage.file, handleSaveNickname, router, usenickname]);

  if (!user) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32">
          <Profile
            userId={user.user_id}
            alt="프로필 사진"
            size={128}
            rounded="full"
            className="w-full h-full border-2 border-gray-200"
            fallbackSrc="/sample_profile.jpeg"
            onFileSelect={handleFileSelect}
            isLoading={profileImage.isUploading}
            updatedAt={updatedAt}
          />
        </div>

        <button
          onClick={() => document.getElementById("profile-file")?.click()}
          className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          disabled={isSaving || profileImage.isUploading}
        >
          프로필 사진 변경
        </button>

        <input
          id="profile-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isSaving || profileImage.isUploading}
        />
      </div>

      <section className="mb-8">
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <div>
            <p className="text-sm text-gray-500">닉네임</p>
            <p className="text-lg font-medium">
              {editedNickname || "설정되지 않음"}
            </p>
          </div>
          <button className="text-blue-600">수정</button>
        </div>
      </section>

      <div className="mt-8">
        <button
          onClick={handleSaveToBackend}
          disabled={
            isSaving || (editedNickname === user.nickname && !profileImage.file)
          }
          className={`w-full rounded-lg py-3 font-medium transition-colors ${
            isSaving || (editedNickname === user.nickname && !profileImage.file)
              ? "cursor-not-allowed bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
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
      
      {/* Success Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${isSuccessModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
          <h3 className="text-lg font-medium mb-4">저장 완료</h3>
          <p className="mb-6">수정사항을 저장하였습니다.</p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIsSuccessModalOpen(false);
                router.push('/mypage');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
