"use client";

import { useState } from "react";
import TermsAgreement from "@/components/auth/TermsAgreement";

export default function UserSignupPage() {
  const [agreements, setAgreements] = useState([
    {
      id: "terms",
      label: "(필수) 이용약관 동의",
      required: true,
      checked: false,
    },
    {
      id: "privacy",
      label: "(필수) 개인정보 수집 및 이용 동의",
      required: true,
      checked: false,
    },
    {
      id: "marketing",
      label: "(선택) 마케팅 정보 수신 동의",
      required: false,
      checked: false,
    },
  ]);

  const handleAgreementChange = (id: string, checked: boolean) => {
    setAgreements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item))
    );
  };

  const handleViewAgreement = (id: string) => {
    // TODO: Implement agreement view logic (e.g., open modal or navigate to terms page)
    console.log(`Viewing agreement: ${id}`);
  };
  return (
    <div className="p-4 pb-16">
      <form action="" className="flex flex-col space-y-2">
        <h2>이메일</h2>
        <input
          type="email"
          placeholder="이메일"
          className="border border-gray-300 rounded-lg p-2 mb-4"
        />
        <h2>비밀번호</h2>
        <input
          type="password"
          placeholder="비밀번호"
          className="border border-gray-300 rounded-lg p-2 mb-4"
        />
        <h2>비밀번호 확인</h2>
        <input
          type="password"
          placeholder="비밀번호 확인"
          className="border border-gray-300 rounded-lg p-2 mb-4"
        />
        <h2>이름</h2>
        <input
          type="text"
          placeholder="이름"
          className="border border-gray-300 rounded-lg p-2 mb-4"
        />
        <h2>휴대폰 번호</h2>
        <input
          type="tel"
          placeholder="휴대폰 번호"
          className="border border-gray-300 rounded-lg p-2"
        />
        <button type="button">인증번호 전송</button>
        <h2>인증번호</h2>
        <input
          type="text"
          placeholder="인증번호"
          className="border border-gray-300 rounded-lg p-2 "
        />
        <button type="button" className="mb-4">
          인증번호 확인
        </button>
        <button type="submit" className="border rounded-lg p-2">
          회원가입
        </button>
      </form>

      <TermsAgreement
        agreements={agreements}
        onAgreementChange={handleAgreementChange}
        onViewAgreement={handleViewAgreement}
      />
    </div>
  );
}
