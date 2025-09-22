// src/app/map/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import MapLoader from "@/components/map/MapLoader";
import { useAppSelector } from "@/store/store";
import { searchPharmacy } from "@/services/pharmacyService";

export default function MapPage() {
  const pharmacies = useAppSelector((s) => s.pharmacy.pharmacies);

  // Redux 약국 데이터로 API 검색 테스트
  const searchReduxPharmacies = async () => {
    try {
      console.group("🔍 Redux 약국 데이터로 API 검색 테스트");

      // Redux에서 약국 데이터 확인
      console.log("📋 Redux 약국 데이터:", {
        count: pharmacies.length,
        hasPharmacies: pharmacies.length > 0,
      });

      if (pharmacies.length === 0) {
        console.warn("⚠️ Redux에 약국 데이터가 없습니다.");
        console.groupEnd();
        return;
      }

      // 각 약국에 대해 API 검색 수행
      const searchResults = [];

      for (let i = 0; i < pharmacies.length; i++) {
        const pharmacy = pharmacies[i];
        console.group(`🏥 ${i + 1}. ${pharmacy.name || "이름 없음"}`);

        console.log("📍 약국 정보:", {
          name: pharmacy.name,
          address: pharmacy.address,
          lat: pharmacy.lat,
          lng: pharmacy.lng,
        });

        // 약국 이름과 주소로 API 검색
        if (pharmacy.name && pharmacy.address) {
          try {
            console.log(
              `🔍 API 검색 시작: "${pharmacy.name}" - "${pharmacy.address}"`
            );

            const result = await searchPharmacy({
              name: pharmacy.name,
              address: pharmacy.address,
            });

            const items = result.response.body.items.item || [];
            console.log(`✅ API 검색 완료: ${items.length}개 결과`);

            // API 결과와 Redux 데이터 비교
            const matches = items.filter((apiPharmacy: any) => {
              const apiName = apiPharmacy.dutyName || "";
              const reduxName = pharmacy.name || "";

              // 이름 매칭 확인
              const nameMatches =
                apiName.includes(reduxName) || reduxName.includes(apiName);

              // 주소 매칭 확인
              const apiAddr = apiPharmacy.dutyAddr || "";
              const reduxAddr = pharmacy.address || "";
              const addrMatches =
                apiAddr.includes(reduxAddr) || reduxAddr.includes(apiAddr);

              return nameMatches || addrMatches;
            });

            console.log(`🎯 매칭된 결과: ${matches.length}개`);
            if (matches.length > 0) {
              console.log("📊 매칭된 약국들:");
              matches.forEach((match: any, index: number) => {
                console.log(
                  `  ${index + 1}. ${match.dutyName} - ${match.dutyAddr}`
                );
              });
            }

            searchResults.push({
              reduxPharmacy: pharmacy,
              apiResults: items,
              matches: matches,
            });
          } catch (error) {
            console.error("❌ API 검색 실패:", error);
          }
        } else {
          console.warn("⚠️ 약국 이름이나 주소 정보가 없습니다.");
        }

        console.groupEnd();
      }

      // 전체 결과 요약
      console.group("📈 전체 검색 결과 요약");
      searchResults.forEach((result, index) => {
        console.log(
          `${index + 1}. ${result.reduxPharmacy.name}: API ${
            result.apiResults.length
          }개 → 매칭 ${result.matches.length}개`
        );
      });
      console.groupEnd();

      console.groupEnd();
    } catch (error) {
      console.error("❌ Redux 약국 검색 테스트 실패:", error);
      console.groupEnd();
    }
  };

  useEffect(() => {
    // 페이지 로드 시 두 가지 검색 모두 실행
    searchReduxPharmacies().finally(() => {
      console.log("\n🔍 Redux 약국 검색 테스트 완료");
    });

    // 기존 약국 검색 함수
    const searchNearbyPharmacies = async () => {
      try {
        console.group("🔍 기존 약국 검색 시작");

        // Redux에 약국 데이터가 있으면 첫 번째 약국의 위치 정보 사용
        let searchAddress = "서울특별시 강남구"; // 기본값

        if (pharmacies.length > 0) {
          const firstPharmacy = pharmacies[0];
          console.log("🏥 첫 번째 약국 정보:", {
            name: firstPharmacy.name,
            address: firstPharmacy.address,
            lat: firstPharmacy.lat,
            lng: firstPharmacy.lng,
          });

          // 주소 파싱 함수
          const parseAddressToCityDistrict = (addr: string) => {
            if (!addr || addr.trim() === "") {
              return "서울특별시";
            }

            const trimmed = addr.trim();

            // 서울특별시/서울시 패턴
            if (
              trimmed.startsWith("서울특별시") ||
              trimmed.startsWith("서울시")
            ) {
              const afterSeoul = trimmed
                .replace(/^(서울특별시|서울시)/, "")
                .trim();
              const parts = afterSeoul.split(/\s+/);
              return `서울특별시 ${parts[0] || ""}`.trim();
            }

            // 다른 시도 패턴들
            const cityPatterns = [
              "서울특별시",
              "서울시",
              "부산광역시",
              "대구광역시",
              "인천광역시",
              "광주광역시",
              "대전광역시",
              "울산광역시",
              "세종특별자치시",
              "경기도",
              "강원도",
              "충청북도",
              "충청남도",
              "전라북도",
              "전라남도",
              "경상북도",
              "경상남도",
              "제주특별자치도",
            ];

            for (const city of cityPatterns) {
              if (trimmed.startsWith(city)) {
                const afterCity = trimmed.replace(city, "").trim();
                const parts = afterCity.split(/\s+/);
                return `${city} ${parts[0] || ""}`.trim();
              }
            }

            // 매치되지 않으면 전체를 시도로 사용
            return trimmed;
          };

          // 주소가 있으면 시와 구까지만 사용
          if (firstPharmacy.address) {
            searchAddress = parseAddressToCityDistrict(firstPharmacy.address);
            console.log("📍 파싱된 주소 사용:", searchAddress);
          } else {
            console.log("⚠️ Redux 약국에 주소 정보 없음, 기본 주소 사용");
          }
        } else {
          console.log("⚠️ Redux에 약국 데이터 없음, 기본 주소 사용");
        }

        const searchParams = {
          name: "", // 모든 약국 검색
          address: searchAddress,
          numOfRows: 1000, // 충분한 데이터를 가져오기 위해 크게 설정
        };

        console.log("📋 검색 파라미터:", {
          ...searchParams,
          serviceKey: `${process.env.NEXT_PUBLIC_PHARMACY_API_KEY?.substring(
            0,
            10
          )}...`, // API 키 일부만 표시
        });
        console.log(
          "🌐 API 요청 URL:",
          `https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire?Q0=${encodeURIComponent(
            searchParams.address
          )}&numOfRows=${searchParams.numOfRows}`
        );

        const result = await searchPharmacy(searchParams);

        console.log("✅ API 응답 수신");

        // API 응답 전체 로깅 (민감한 정보는 가림)
        console.group("📊 API 응답 데이터");
        console.log("📋 응답 헤더:", result.response?.header);

        const itemCount = result.response?.body?.items?.item?.length || 0;
        console.log(`📊 검색 결과: 총 ${itemCount}건의 약국을 찾았습니다.`);

        if (itemCount === 0) {
          console.warn("⚠️ 검색 결과가 없습니다. 검색 조건을 확인해주세요.");
          console.groupEnd(); // API 응답 데이터 그룹 닫기
          console.groupEnd(); // 검색 시작 그룹 닫기
          return;
        }

        // 결과에서 필요한 정보만 추출
        const simplifiedResults = result.response.body.items.item.map(
          (pharmacy, index) => ({
            "No.": index + 1,
            약국명: pharmacy.dutyName,
            주소: pharmacy.dutyAddr,
            전화번호: pharmacy.dutyTel1 || "정보 없음",
            위도: pharmacy.wgs84Lat,
            경도: pharmacy.wgs84Lon,
            "평일 운영": pharmacy.dutyTime1s
              ? `${pharmacy.dutyTime1s} ~ ${pharmacy.dutyTime1c}`
              : "정보 없음",
            "토요일 운영": pharmacy.dutyTime7s
              ? `${pharmacy.dutyTime7s} ~ ${pharmacy.dutyTime7c}`
              : "휴무",
            "일요일 운영": pharmacy.dutyTime8s
              ? `${pharmacy.dutyTime8s} ~ ${pharmacy.dutyTime8c}`
              : "휴무",
          })
        );

        // 상세 정보 로깅
        console.group("📋 상세 검색 결과");
        console.log(`📍 검색 지역: ${searchParams.address || "전체"}`);
        console.log(`🔢 검색 결과 수: ${simplifiedResults.length}건`);

        // 상위 3개만 자세히 표시
        console.log("🏆 상위 3개 약국 정보:");
        simplifiedResults.slice(0, 3).forEach((pharmacy, index) => {
          console.group(`🏥 ${pharmacy["No."]}. ${pharmacy["약국명"]}`);
          console.log(`📍 주소: ${pharmacy["주소"]}`);
          console.log(`📞 전화: ${pharmacy["전화번호"]}`);
          console.log(`🕒 평일: ${pharmacy["평일 운영"]}`);
          console.log(`🗓️ 토요일: ${pharmacy["토요일 운영"]}`);
          console.log(`🌞 일요일: ${pharmacy["일요일 운영"]}`);
          console.groupEnd();
        });

        // 전체 결과는 테이블로 표시
        console.log("📊 전체 검색 결과:");
        console.table(simplifiedResults);
        console.groupEnd(); // 상세 검색 결과 그룹 닫기
      } catch (error: unknown) {
        console.group("❌ 약국 검색 오류");

        if (axios.isAxiosError(error)) {
          console.error("🚨 네트워크/API 오류 발생");
          console.error(`📛 상태 코드: ${error.response?.status || "N/A"}`);
          console.error(`📝 오류 메시지: ${error.message}`);

          if (error.response) {
            console.error("📦 서버 응답 데이터:", error.response.data);
            console.error(
              `🔍 에러 코드: ${
                error.response.data?.response?.header?.resultCode || "N/A"
              }`
            );
            console.error(
              `💬 에러 메시지: ${
                error.response.data?.response?.header?.resultMsg || "N/A"
              }`
            );
          }

          if (error.request) {
            console.error("❓ 서버로부터 응답을 받지 못했습니다.");
            console.error("요청 정보:", {
              method: error.config?.method,
              url: error.config?.url,
              params: error.config?.params,
            });
          }
        } else if (error instanceof Error) {
          console.error("📛 오류 메시지:", error.message);
          if ("stack" in error) {
            console.error("🔍 스택 트레이스:", error.stack);
          }
        } else {
          console.error("❓ 알 수 없는 오류:", error);
        }

        console.groupEnd(); // 오류 그룹 닫기
        console.groupEnd(); // 검색 시작 그룹 닫기
      }
    };

    searchNearbyPharmacies().finally(() => {
      console.groupEnd(); // 검색 시작 그룹 닫기
      console.log(
        "\n🔍 기존 검색이 완료되었습니다. 개발자 도구의 콘솔을 확인해주세요."
      );
    });

    // 클린업 함수 (필요시 사용)
    return () => {
      console.log("🗑️ 컴포넌트 정리 중...");
    };
  }, [pharmacies]);

  return (
    <div className="w-full h-full">
      <MapLoader initialPharmacies={pharmacies} />
    </div>
  );
}
