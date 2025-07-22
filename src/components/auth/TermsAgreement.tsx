import React from 'react';

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
      className="form-checkbox h-4 w-4 text-blue-600 rounded"
      required={required}
      checked={checked}
      onChange={(e) => onChange(id, e.target.checked)}
    />
    <label htmlFor={id} className="ml-2 text-gray-700 text-sm">
      {label}
    </label>
    <button
      type="button"
      className="ml-2 text-xs text-blue-600 hover:underline"
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
  const allChecked = agreements.every((item) => item.checked);
  
  const handleAllAgree = (checked: boolean) => {
    onAllAgree(checked);
  };

  return (
    <div className="mt-8 border-t pt-4">
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-blue-600 rounded"
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
            onView={onViewAgreement}
          />
        ))}
      </div>
    </div>
  );
};

export default TermsAgreement;
