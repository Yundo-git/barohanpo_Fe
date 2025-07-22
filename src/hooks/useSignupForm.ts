import axios from "axios";
import { useState, useCallback } from "react";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  verificationCode: string;
  agreements: {
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
  };
}

export const useSignupForm = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    verificationCode: "",
    agreements: {
      terms: false,
      privacy: false,
      marketing: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 입력값 변경 핸들러
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;

      if (name.startsWith("agreements.")) {
        const agreementName = name.split(
          "."
        )[1] as keyof SignupFormData["agreements"];
        setFormData((prev) => ({
          ...prev,
          agreements: {
            ...prev.agreements,
            [agreementName]: checked,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    },
    []
  );

  // 전체 동의 체크박스 핸들러
  const handleAllAgreements = useCallback((checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: {
        terms: checked,
        privacy: checked,
        marketing: checked,
      },
    }));
  }, []);

  //   // 인증번호 전송 함수
  //   const sendVerificationCode = useCallback(async (phoneNumber: string) => {
  //     try {
  //       setIsLoading(true);
  //       setError(null);
  //       // TODO: 실제 인증번호 전송 API 호출
  //       // const response = await api.sendVerificationCode(phoneNumber);
  //       // return response.success;
  //       return true; // 임시 반환값
  //     } catch (err) {
  //       setError("인증번호 전송에 실패했습니다.");
  //       return false;
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }, []);

  // 회원가입 제출 함수
  const submitSignup = useCallback(async () => {
    // 필수 동의사항 체크
    if (!formData.agreements.terms || !formData.agreements.privacy) {
      setError("필수 약관에 동의해주세요.");
      return false;
    }

    // 비밀번호 일치 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`,
        formData
      );
      return response.data.success;
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error("회원가입 중 오류가 발생했습니다.", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleAllAgreements,
    // sendVerificationCode,
    submitSignup,
  };
};
