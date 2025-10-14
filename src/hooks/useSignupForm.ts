import axios from "axios";
import { useState, useCallback } from "react";
import useLogin from "@/hooks/useLogin";
import { useRouter } from "next/navigation";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  verificationCode: string;
  agreements: {
    age: boolean;
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
      age: false,
      terms: false,
      privacy: false,
      marketing: false,
    },
  });

  const { login } = useLogin();
  const router = useRouter();
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
        age: checked,
        terms: checked,
        privacy: checked,
        marketing: checked,
      },
    }));
  }, []);

  // 회원가입 제출 함수
  const submitSignup = useCallback(async () => {
    // 필수 동의사항 체크
    if (!formData.agreements.age || !formData.agreements.terms || !formData.agreements.privacy) {
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

      // 회원가입 요청 (nickname 제거된 상태)
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`,
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }
      );

      // 회원가입 직후 자동 로그인 시도
      try {
        const loginData = {
          email: formData.email,
          password: formData.password,
        };
        const loginResponse = await login(loginData);

        if (loginResponse.success) {
          router.push("/");
        }
        return loginResponse.success;
      } catch (error) {
        setError("회원가입 후 로그인 중 오류가 발생했습니다.");
        console.error(error);
        return false;
      }
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, router, login]);

  // 폼 유효성 검사
  const isFormValid = 
    formData.email && 
    formData.password && 
    formData.confirmPassword && 
    formData.name && 
    formData.phone && 
    formData.verificationCode &&
    formData.agreements.terms && 
    formData.agreements.privacy &&
    formData.password === formData.confirmPassword;

  return {
    formData,
    isLoading,
    error,
    isFormValid: !!isFormValid && !isLoading,
    handleInputChange,
    handleAllAgreements,
    submitSignup,
  };
};
