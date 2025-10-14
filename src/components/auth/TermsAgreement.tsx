import React, { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";

const TERMS_CONTENT: Record<string, { title: string; content: string }> = {
  age: {
    title: "만 14세 이상 확인",
    content: `본 서비스는 만 14세 이상부터 이용 가능합니다. 만 14세 미만 아동의 개인정보 수집은 법정대리인의 동의를 받아 처리됩니다.`
  },
  terms: {
    title: "서비스 이용약관",
    content: `제1조 (목적)
본 약관은 바로한포 서비스 운영자(이하 "회사")가 제공하는 맞춤형 건강기능식품 상담 약국 안내 서비스(이하 "서비스")의 이용 조건 및 절차를 규정합니다.

제2조 (회원 가입)
1. 회원은 이름, 이메일, 비밀번호, 휴대폰 번호를 제공하여 가입할 수 있습니다.
2. 회사는 회원 정보를 허위로 기재하거나 타인의 정보를 도용한 경우 가입을 거부하거나 사후 해지할 수 있습니다.

제3조 (서비스 내용)
회사는 지도 기반으로 맞춤 상담이 가능한 약국 정보를 제공하며, 실제 상담 및 구매는 약국과 회원 간에 이루어집니다.

제3조의2 (위치정보의 이용)
1. 회사는 회원의 현재 위치를 기반으로 가장 가까운 상담 약국을 안내하기 위해 위치정보를 활용할 수 있습니다.
2. 회원은 단말기 설정을 통해 위치기반서비스 제공 여부를 선택하거나 철회할 수 있습니다.
3. 회원이 위치정보 제공을 거부할 경우, 위치 기반 약국 안내 기능이 제한될 수 있습니다.
4. 회사는 위치정보를 약국 검색 목적 외에 사용하지 않으며, 별도 저장하지 않습니다.

제4조 (책임 제한)
1. 회사는 약국이 제공하는 상담 및 건강기능식품 판매에 대해 책임을 지지 않습니다.
2. 서비스는 정보 제공 목적이며, 의학적 진단이나 처방을 대체하지 않습니다.

제5조 (회원의 의무)
회원은 법령 및 본 약관을 준수하며, 서비스 내 정보를 무단 복제하거나 상업적으로 이용해서는 안 됩니다.

제6조 (이용 해지)
회원은 언제든지 탈퇴할 수 있으며, 회사는 약관 위반 시 사전 통보 후 서비스 이용을 제한할 수 있습니다.

제7조 (약관 변경)
회사는 필요한 경우 약관을 변경할 수 있으며, 변경 내용은 사전에 공지합니다.

부칙
본 약관은 2025년 00월 00일부터 시행합니다.`
  },
  privacy: {
    title: "개인정보 수집 및 이용 동의",
    content: `[개인정보 수집 및 이용 동의 내용이 여기에 표시됩니다.]\n\n1. 수집하는 개인정보 항목\n2. 개인정보의 수집 및 이용 목적\n3. 개인정보의 보유 및 이용 기간\n...`
  },
  marketing: {
    title: "마케팅 정보 수신 동의",
    content: `[마케팅 정보 수신 동의 내용이 여기에 표시됩니다.]\n\n- 수집 항목: 이메일 주소, 휴대전화번호\n- 수집 목적: 이벤트 및 혜택 안내, 맞춤형 광고\n- 보유 기간: 동의 철회 시까지`
  }
};

interface AgreementItemProps {
  id: string;
  label: string;
  required?: boolean;
  checked: boolean;
  onChange: (id: string, checked: boolean) => void;
  onView: (id: string) => void;
}

const AgreementItem: React.FC<AgreementItemProps> = ({
  id,
  label,
  required = false,
  checked,
  onChange,
  onView,
}) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      className="form-checkbox h-4 w-4 text-main rounded"
      required={required}
      checked={checked}
      onChange={(e) => onChange(id, e.target.checked)}
    />
    <label htmlFor={id} className="ml-2 text-gray-700 text-sm">
      {label}
    </label>
    <button
      type="button"
      className="ml-2 text-xs text-main hover:underline"
      onClick={() => onView(id)}
    >
      보기
    </button>
  </div>
);

interface AgreementItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

interface TermsAgreementProps {
  agreements: AgreementItem[];
  onAgreementChange: (id: string, checked: boolean) => void;
  onViewAgreement: (id: string) => void;
  onAllAgree: (checked: boolean) => void;
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({
  agreements,
  onAgreementChange,
  onViewAgreement,
  onAllAgree,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const allChecked = agreements.every((item) => item.checked);

  const handleAllAgree = (checked: boolean) => {
    onAllAgree(checked);
  };

  const handleViewTerm = (id: string) => {
    setSelectedTerm(id);
  };

  const closeBottomSheet = () => {
    setSelectedTerm(null);
  };

  return (
    <div className="mt-8 pt-4">
      <div className="mb-4">
        <label className="flex items-center border-b pb-4">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-main rounded"
            checked={allChecked}
            onChange={(e) => handleAllAgree(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 font-medium">
            약관 전체 동의
          </span>
        </label>
      </div>

      <div className="space-y-3 pl-6">
        {agreements.map((agreement) => (
          <AgreementItem
            key={agreement.id}
            id={agreement.id}
            label={agreement.label}
            required={agreement.required}
            checked={agreement.checked}
            onChange={onAgreementChange}
            onView={handleViewTerm}
          />
        ))}
      </div>

      {/* Bottom Sheet */}
      {selectedTerm && (
        <BottomSheet isOpen={!!selectedTerm} onClose={closeBottomSheet}>
          <div >
            <h3 className="text-lg font-bold mb-4">
              {TERMS_CONTENT[selectedTerm]?.title || '약관'}
            </h3>
            <div className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 whitespace-pre-line">
              {TERMS_CONTENT[selectedTerm]?.content || '약관 내용이 없습니다.'}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeBottomSheet}
                className="px-4 py-2 bg-main text-white rounded-lg text-sm font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default TermsAgreement;
