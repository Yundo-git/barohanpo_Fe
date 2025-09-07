"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/store';
import useAuth from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import Profile from '@/components/auth/Profile';
import DevelopmentNoticeModal from '@/components/DevelopmentNoticeModal';
import ReviewListModal from '@/components/Review/ReviewListModal';

export default function MyPage() {
  const [showDevNotice, setShowDevNotice] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const editProfile = () => {
    if (user) {
      router.push(`/auth/${user.user_id}`);
    }
  };

  const handleMyReview = () => {
    setShowReviewModal(true);
  };

  const handlePrescriptionRecord = () => {
    setShowDevNotice(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen p-4">
        <section className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3" onClick={editProfile}>
            <div className="relative group">
              <Profile
                userId={user?.user_id || 0}
                version={user?.profileImageVersion}
                alt="사용자 프로필"
                size={56}
                rounded="full"
                className="w-[4.5rem] h-[4.5rem] cursor-pointer"
              />
            </div>
            <h1 className="text-xl font-semibold">{user?.nickname}</h1>
          </div>
        </section>

        {/* User Actions */}
        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">나의 활동</h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePrescriptionRecord}
              className="text-left p-2 hover:bg-gray-50 rounded"
            >
              내 영양제 처방 기록
            </button>
            <button className="text-left p-2 hover:bg-gray-50 rounded">
              찜 목록
            </button>
            <button 
              onClick={handleMyReview}
              className="text-left p-2 hover:bg-gray-50 rounded"
            >
              내 후기
            </button>
          </div>
        </section>

        {/* Account Management */}
        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-medium mb-4">계정 관리</h2>
          <button 
            onClick={handleLogout}
            className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded"
          >
            로그아웃
          </button>
        </section>

        {/* Support */}
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">고객센터</h2>
          <button className="w-full text-left p-2 hover:bg-gray-50 rounded">
            문의하기
          </button>
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
      </div>
    </AuthGuard>
  );
}
