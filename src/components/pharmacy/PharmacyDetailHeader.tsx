import Image from 'next/image';
import BusinessHours from './BusinessHours';
import { Pharmacy } from '@/types/pharmacy';

interface PharmacyDetailHeaderProps {
  pharmacy: Pharmacy;
}

const PharmacyDetailHeader = ({ pharmacy }: PharmacyDetailHeaderProps) => {
  return (
    <div className="flex flex-col">
      <div className="w-full aspect-[5/4] bg-main flex flex-col justify-center items-center overflow-hidden">
        <Image
          src="/logo.svg"
          alt="약국 로고"
          width={80}
          height={80}
          className="mb-4"
          priority
        />
        <p className="T1_SB_20 text-white text-center leading-tight drop-shadow-md font-medium">
          해당약국 이미지준비중입니다
        </p>
      </div>

      <div className="py-6 px-5">
        <h1 className="T2_SB_20">{pharmacy.name}</h1>
        <div className="space-y-2 mt-4">
          <div className="flex gap-1.5 B2_RG_14 text-subText2 items-center">
            <Image
              src="/icon/Environment.svg"
              alt="주소"
              width={16}
              height={16}
              className="w-4 h-4"
              priority
            />
            <span>{pharmacy.address}</span>
          </div>
          <div className="flex flex-col gap-2">
            {typeof pharmacy.distance === "number" && (
              <div className="flex gap-1.5 B2_RG_14 text-subText2 items-center">
                <Image
                  src="/icon/Environment.svg"
                  alt="거리"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                  priority
                />
                <span>
                  {pharmacy.distance < 1
                    ? `${Math.round(pharmacy.distance * 1000)}m` 
                    : `${pharmacy.distance.toFixed(1)}km`}{" "}
                  거리
                </span>
              </div>
            )}

            {/* 영업시간 요약 (오늘) */}
            {pharmacy.business_hours_json && (
              <BusinessHours businessHours={pharmacy.business_hours_json} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDetailHeader;
