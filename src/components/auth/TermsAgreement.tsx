import React, { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import { TERMS_CONTENT } from "@/constants/termsContent";

export type TermId = keyof typeof TERMS_CONTENT;

interface AgreementItemProps {
  id: TermId;
  label: string;
  required?: boolean;
  checked: boolean;
  onChange: (id: TermId, checked: boolean) => void;
  onView: (id: TermId) => void;
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
  agreements: {
    id: TermId;
    label: string;
    required?: boolean;
    checked: boolean;
  }[];
  onAgreementChange: (id: TermId, checked: boolean) => void;
  onViewAgreement: (id: TermId) => void;
  onAllAgree: (checked: boolean) => void;
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({
  agreements,
  onAgreementChange,
  onViewAgreement,
  onAllAgree,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<TermId | null>(null);
  const allChecked = agreements.every((item) => item.checked);

  const handleAllAgree = (checked: boolean) => {
    onAllAgree(checked);
  };

  const handleViewTerm = (id: TermId, shouldCheck = false) => {
    setSelectedTerm(id);
    if (shouldCheck) {
      onAgreementChange(id, true);
    }
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
          <span className="ml-2 text-gray-700 font-medium">약관 전체 동의</span>
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
          <div>
            <h3 className="text-lg font-bold mb-4">
              {TERMS_CONTENT[selectedTerm]?.title || "약관"}
            </h3>
            <div className="max-h-[60vh] overflow-y-auto text-sm text-gray-700 whitespace-pre-line">
              {TERMS_CONTENT[selectedTerm]?.content || "약관 내용이 없습니다."}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (selectedTerm) {
                    onAgreementChange(selectedTerm, true);
                  }
                  closeBottomSheet();
                }}
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
