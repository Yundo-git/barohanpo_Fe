"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "@/store/userSlice";
import { logout as logoutApi } from "@/services/authService";
import type { RootState } from "@/store/store";
import UserProfileSection from "@/components/mypage/UserProfileSection";
import DevelopmentNoticeModal from "@/components/ui/DevelopmentNoticeModal";
import ReviewListModal from "@/components/Review/ReviewListModal";
import { useState } from "react";
import FavoriteListModal from "@/components/auth/FavoriteListModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function MyPage() {
  const [showDevNotice, setShowDevNotice] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
      // 서버 요청 실패해도 클라이언트 상태는 정리
    } finally {
      // Redux 상태 초기화
      dispatch(clearAuth());
      // 로그인 페이지로 리다이렉트
      router.push("/auth");
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  const editProfile = () => {
    router.push("/auth/edit");
  };

  const handleMyReview = () => {
    setShowReviewModal(true);
  };

  const handlePrescriptionRecord = () => {
    setShowDevNotice(true);
  };

  const handleMyFavorite = () => {
    setShowFavoriteModal(true);
  };

  return (
    <div className="flex flex-col  min-h-screen p-5">
      <UserProfileSection 
        user={user} 
        onEditProfile={editProfile} 
      />
      {/* 유저 내역 */}
      <section className="py-6 flex flex-col gap-4 items-start">
        <div className="flex gap-3 justify-between items-center">
          <Image src="/icon/Text.svg" alt="아이콘" width={24} height={24} />
          <button
            className="B1_MD_15 text-mainText"
            onClick={handlePrescriptionRecord}
          >
            내 영양제 처방 기록
          </button>
        </div>
        <div className="flex gap-3 justify-between items-center">
          <div className="w-6 h-6 relative">
            <Image
              src="/icon/Favorite.svg"
              alt="아이콘"
              fill
              sizes="1.5rem"
              className="object-contain"
            />
          </div>
          <button className="B1_MD_15 text-mainText" onClick={handleMyFavorite}>
            찜 목록
          </button>
        </div>
        <div className="flex gap-3 justify-between items-center">
          <Image src="/icon/EditS.svg" alt="아이콘" width={24} height={24} />
          <button className="B1_MD_15 text-mainText" onClick={handleMyReview}>
            내 후기
          </button>
        </div>
      </section>

      <DevelopmentNoticeModal
        isOpen={showDevNotice}
        onClose={() => setShowDevNotice(false)}
      />

      <ReviewListModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        userId={user?.user_id || 0}
      />
      <FavoriteListModal
        isOpen={showFavoriteModal}
        onClose={() => setShowFavoriteModal(false)}
        userId={user?.user_id || 0}
      />
      <section className="border-t py-6 border-gray-200">
        <h1 className="B1_RG_15 pb-4 text-mainText">문의</h1>
        <button className="B1_MD_15 text-mainText">문의하기</button>
      </section>
      <section className="border-t py-6 border-gray-200">
        <h1 className="B1_RG_15 pb-4 text-mainText">계정관리</h1>
        <button className="B1_MD_15 text-mainText" onClick={handleLogoutClick}>
          로그아웃
        </button>

        <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleConfirmLogout}
          title="로그아웃"
          message="정말 로그아웃 하시겠습니까?"
          confirmText="로그아웃"
          cancelText="취소"
        />
      </section>
    </div>
  );
}
