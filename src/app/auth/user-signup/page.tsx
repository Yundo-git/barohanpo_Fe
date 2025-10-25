"use client";

import { useRouter } from "next/navigation";
import TermsAgreement from "@/components/auth/TermsAgreement";
import { useSignupForm } from "@/hooks/useSignupForm";
import { TermId } from "@/constants/termsContent";

export default function UserSignupPage() {
  const router = useRouter();
  const {
    formData,
    isLoading,
    error,
    isFormValid,
    handleInputChange,
    handleAllAgreements,
    submitSignup,
  } = useSignupForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitSignup();
    if (success) {
      router.push("/");
    }
  };

  const agreementItems: {
    id: TermId;
    label: string;
    required: boolean;
    checked: boolean;
  }[] = [
    {
      id: "age",
      label: "(필수) 본인은 만 14세 이상입니다.",
      required: true,
      checked: formData.agreements.age,
    },
    {
      id: "terms",
      label: "(필수) 서비스 이용약관",
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

  const handleViewAgreement = (id: string) => {
    // This is now handled by the TermsAgreement component
  };

  return (
    <div className="p-4 pt-12 pb-24 min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        {/* 이름 */}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="이름"
          className="w-full border-b border-gray-300 p-2 focus:outline-none B1_RG_15"
          required
        />

        {/* 이메일 */}
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="이메일"
          className="w-full border-b border-gray-300 p-2 focus:outline-none"
          required
        />

        {/* 비밀번호 */}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="비밀번호"
          className="w-full border-b border-gray-300 p-2 focus:outline-none"
          minLength={8}
          required
        />

        {/* 비밀번호 확인 */}
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="비밀번호 재입력"
          className="w-full border-b border-gray-300 p-2 focus:outline-none"
          minLength={8}
          required
        />

        {/* 휴대폰 번호 */}
        {/* <div className="flex items-center border-b border-gray-300">
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="휴대폰 번호"
            className="flex-1 p-2 focus:outline-none"
            required
          /> */}
          {/* <button
            type="button"
            disabled={isLoading}
            className="text-sm bg-gray-800 text-white px-3 py-1 rounded ml-2 disabled:opacity-50"
          >
            인증하기
          </button> */}
        {/* </div> */}

        {/* 인증번호 */}
        {/* <div className="flex items-center border-b border-gray-300">
          <input
            type="text"
            name="verificationCode"
            value={formData.verificationCode}
            onChange={handleInputChange}
            placeholder="인증번호"
            className="flex-1 p-2 focus:outline-none"
            maxLength={6}
            required
          />
          <button
            type="button"
            disabled={isLoading}
            className="text-sm bg-gray-800 text-white px-3 py-1 rounded ml-2 disabled:opacity-50"
          >
            확인
          </button>
        </div> */}

        {/* 에러 메시지 */}
        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* 약관 동의 */}
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

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          className={`w-full py-3 rounded-lg font-medium ${
            isFormValid ? 'bg-main text-white' : 'bg-gray-200 text-gray-400'
          } disabled:opacity-50`}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "처리 중..." : "회원가입"}
        </button>
      </form>
    </div>
  );
}
