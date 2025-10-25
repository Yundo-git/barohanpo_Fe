import React from 'react';
import Image from 'next/image';
import Tabs from '@/components/ui/Tab';
import ReviewCard from '@/components/Review/ReviewCard';
import StaticLocationMap from '@/components/map/StaticLocationMap';
import { Pharmacy } from '@/types/pharmacy';
import { Review } from '@/types/review';

interface PharmacyTabsProps {
  pharmacy: Pharmacy | null | undefined;
  derivedLat: number | undefined;
  derivedLng: number | undefined;
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
}

const PharmacyTabs: React.FC<PharmacyTabsProps> = ({
  pharmacy,
  derivedLat,
  derivedLng,
  reviews,
  isLoading,
  error,
}) => {
  if (!pharmacy) {
    return (
      <div className="mt-6 p-5">
        <p className="B1_RG_15 text-subText">
          약국 정보를 불러오는 중입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Tabs
        items={[
          {
            key: "info",
            label: "약국 정보",
            component: (
              <div className="p-5">
                {/* 약국정보(etc)이 있는 경우에만 표시 */}
                {pharmacy.etc?.trim() && (
                  <div>
                    <h3 className="T3_SB_18 pb-6 pt-1">약국정보</h3>
                    <div>
                      <p className="B1_RG_15 pb-6">{pharmacy.etc}</p>
                    </div>
                  </div>
                )}

                <h3 className="T3_SB_18 py-4">약국 위치</h3>

                <span className="B1_RG_15 text-subText">
                  {pharmacy.address}
                </span>
                    <div className="mt-6">
                      {Number.isFinite(derivedLat) &&
                      Number.isFinite(derivedLng) ? (
                        <StaticLocationMap
                          lat={derivedLat as number}
                          lng={derivedLng as number}
                          className="h-48 rounded-lg"
                        />
                      ) : (
                        <div className="h-48 rounded-lg bg-gray-100 flex items-center justify-center text-subText">
                          위치 좌표를 불러오는 중입니다.
                        </div>
                      )}
                    </div>
              </div>
            ),
          },
          {
            key: "reviews",
            label: "후기",
            component: (
              <div className="p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">
                    후기를 불러오는 중 오류가 발생했습니다.
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.review_id}
                        review={review}
                        showPharmacyName={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[50dvh]">
                    <Image
                      src="/icon/Paper.svg"
                      alt="리뷰 없음"
                      width={70}
                      height={70}
                      priority
                    />
                    <h1 className="T3_MD_18 text-subText2">
                      아직 등록된 리뷰가 없어요.
                    </h1>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        defaultActiveKey="info"
        onChange={(key: string) => {
          console.log(`Tab changed to: ${key}`);
        }}
      />
    </div>
  );
};

export default PharmacyTabs;
