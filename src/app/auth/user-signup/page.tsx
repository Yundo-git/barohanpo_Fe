"use client";

import { useRouter } from "next/navigation";
import TermsAgreement from "@/components/auth/TermsAgreement";
import { useSignupForm } from "@/hooks/useSignupForm";

export default function UserSignupPage() {
  const router = useRouter();
  const {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleAllAgreements,
    // sendVerificationCode,
    submitSignup,
  } = useSignupForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 방지
    const success = await submitSignup(); // 회원가입 제출
    if (success) {
      router.push("/");
    }
  };

  //   const handleSendVerificationCode = async () => {
  //     if (!formData.phone) {
  //       alert("휴대폰 번호를 입력해주세요.");
  //       return;
  //     } else {
  //       alert("인증번호 기능 개발 중 입니다.");
  //     }
  //     await sendVerificationCode(formData.phone); // 인증번호 전송
  //   };
  const agreementItems = [
    {
      id: "terms",
      label: "(필수) 이용약관 동의",
      required: true,
      checked: formData.agreements.terms,
    },
    {
      id: "privacy",
      label: "(필수) 개인정보 수집 및 이용 동의",
      required: true,
      checked: formData.agreements.privacy,
    },
    {
      id: "marketing",
      label: "(선택) 마케팅 정보 수신 동의",
      required: false,
      checked: formData.agreements.marketing,
    },
  ];

  return (
    <div className="p-4 pb-16">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <h2>이메일</h2>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="이메일"
          className="border border-gray-300 rounded-lg p-2 mb-4"
          required
        />
        <h2>비밀번호</h2>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="비밀번호 (8자 이상)"
          className="border border-gray-300 rounded-lg p-2 mb-4"
          minLength={8}
          required
        />
        <h2>비밀번호 확인</h2>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="비밀번호 확인"
          className="border border-gray-300 rounded-lg p-2 mb-4"
          minLength={8}
          required
        />
        <h2>이름</h2>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="이름"
          className="border border-gray-300 rounded-lg p-2 mb-4"
          required
        />
        <h2>휴대폰 번호</h2>
        <div className="flex border border-gray-300 rounded-lg p-2 justify-between">
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="휴대폰 번호 ('-' 제외)"
            required
          />
          <button
            type="button"
            // onClick={handleSendVerificationCode}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "전송 중..." : "인증하기"}
          </button>
        </div>
        <h2>인증번호</h2>
        <div className="flex border border-gray-300 rounded-lg p-2 justify-between">
          <input
            type="text"
            name="verificationCode"
            value={formData.verificationCode}
            onChange={handleInputChange}
            placeholder="인증번호 6자리"
            maxLength={6}
            required
          />
          <button
            type="button"
            // onClick={handleSendVerificationCode}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "전송 중..." : "확인"}
          </button>
        </div>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <TermsAgreement
          agreements={agreementItems}
          onAgreementChange={(id, checked) =>
            handleInputChange({
              target: {
                name: `agreements.${id}`,
                type: "checkbox",
                checked,
              },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          onAllAgree={handleAllAgreements}
          onViewAgreement={(id) => console.log(`Viewing agreement: ${id}`)}
        />

        <button
          type="submit"
          className="bg-blue-500 text-white py-3 rounded-lg font-medium mt-4"
          disabled={isLoading}
        >
          {isLoading ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </div>
  );
}
