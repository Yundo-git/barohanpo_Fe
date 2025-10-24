import Image from "next/image";
import { useState } from "react";

interface BusinessHoursProps {
  businessHours: string | Record<string, string>;
  className?: string;
}

const BusinessHours = ({
  businessHours,
  className = "",
}: BusinessHoursProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!businessHours) return null;

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayNames = {
    mon: "월",
    tue: "화",
    wed: "수",
    thu: "목",
    fri: "금",
    sat: "토",
    sun: "일",
  };

  const today = days[new Date().getDay()];
  const parsedHours =
    typeof businessHours === "string"
      ? JSON.parse(businessHours)
      : businessHours;

  const todayHours = parsedHours[today] || "휴무";

  return (
    <div className="relative w-full">
      <div
        className={`flex gap-1.5 B2_RG_14 text-subText2 items-center ${className}`}
      >
        <Image
          src="/icon/Clock.svg"
          alt="영업시간"
          width={16}
          height={16}
          className="w-4 h-4 flex-shrink-0"
        />
        <div className="flex items-center gap-1">
          <span>오늘 </span>
          <span className="B2_M_14">{todayHours}</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-5 h-5"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-100 w-56">
            <div className="p-3 max-h-60 overflow-y-auto">
              {Object.entries(parsedHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between py-1.5 px-2 hover:bg-gray-50 rounded">
                  <span className="B2_M_14 text-gray-700">
                    {dayNames[day as keyof typeof dayNames] || day}
                  </span>
                  <span className="text-right text-gray-600">
                    {typeof hours === "string" ? hours : "휴무"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessHours;
