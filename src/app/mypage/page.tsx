"use client";

import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "@/store/userSlice";
import { logout as logoutApi } from "@/services/authService";
import type { RootState } from "@/store/store";
import Profile from "@/components/auth/Profile";
import DevelopmentNoticeModal from "@/components/DevelopmentNoticeModal";
import ReviewListModal from "@/components/Review/ReviewListModal";
import { useState } from "react";

export default function MyPage() {
  const [showDevNotice, setShowDevNotice] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
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
      router.push("/auth/user-signin");
      router.refresh(); // Next.js 캐시 초기화
    }
  };
  const editProfile = () => {
    router.push("/auth/" + user?.user_id);
  };

  const handleMyReview = () => {
    setShowReviewModal(true);
  };

  const handlePrescriptionRecord = () => {
    setShowDevNotice(true);
  };

  return (
    <div className="flex flex-col  min-h-screen p-4">
      <section className="flex justify-between" onClick={editProfile}>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div onClick={editProfile}>
              <Profile
                userId={user?.user_id || 0}
                version={user?.profileImageVersion}
                alt="사용자 프로필"
                size={56}
                rounded="full"
                className="w-[4.5rem] h-[4.5rem]"
              />
              
            </div>
          </div>
          <h1>{user?.nickname}</h1>
        </div>
        <p>버튼</p>
      </section>
      {/* 유저 내역 */}
      <section className="pt-4 flex flex-col gap-4 items-start">
        <button onClick={handlePrescriptionRecord}>내 영양제 처방 기록</button>
        <button>찜 목록</button>
        <button onClick={handleMyReview}>내 후기</button>
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
      <section className="border-t pt-4 border-gray-200">
        <h1>문의</h1>
        <button className="mt-4">문의하기</button>
      </section>
      <section className="border-t pt-4 border-gray-200">
        <h1>계정관리</h1>
        <button className="mt-4" onClick={handleLogout}>
          로그아웃
        </button>
      </section>
    </div>
  );
}