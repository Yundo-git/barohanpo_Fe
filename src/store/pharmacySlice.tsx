// store/pharmacySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { PharmacyWithUser } from "@/types/pharmacy";

// 비동기 Thunk 정의
export const fetchNearbyPharmacies = createAsyncThunk<
  PharmacyWithUser[],
  { lat: number; lng: number; radius?: number },
  { rejectValue: string }
>(
  "pharmacy/fetchNearby",
  async ({ lat, lng, radius = 5000 }, { rejectWithValue }) => {
    try {
      console.log(`🔍 [API Request] Searching for pharmacies near lat: ${lat}, lng: ${lng}, radius: ${radius}m`);
      
      // API 엔드포인트 수정
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      console.log("🌐 [API Request] URL:", apiUrl);

      let response;
      try {
        response = await fetch(apiUrl);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown network error";
        console.error("Network error when fetching pharmacies:", errorMessage);
        throw new Error(`Network error: ${errorMessage}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText,
        };
        console.error("❌ [API Error] Response:", errorDetails);
        return rejectWithValue(
          `약국 정보를 불러오는 중 오류가 발생했습니다. (${response.status} ${response.statusText})`
        );
      }

      let data;
      try {
        data = await response.json();
        console.log("📦 [API Response] Raw data:", data);
      } catch (jsonError) {
        console.error("❌ [API Error] JSON 파싱 오류:", jsonError);
        return rejectWithValue("서버 응답을 처리하는 중 오류가 발생했습니다.");
      }

      // 응답 데이터 처리
      let pharmacyList = [];
      if (Array.isArray(data)) {
        pharmacyList = data;
      } else if (data && Array.isArray(data.data)) {
        pharmacyList = data.data;
      } else if (data && data.pharmacies && Array.isArray(data.pharmacies)) {
        pharmacyList = data.pharmacies;
      } else if (data) {
        // 단일 약국 객체인 경우 배열로 감싸기
        pharmacyList = [data];
      }

      console.log(`✅ [API Success] Found ${pharmacyList.length} pharmacies`);

      // API 응답 로깅
      console.log("🔍 [API Response] Full Response:", {
        rawData: data,
        extractedList: pharmacyList,
        isArray: Array.isArray(pharmacyList),
        length: pharmacyList.length,
      });

      // 로깅을 위한 임시 인터페이스
      interface PharmacyForLogging {
        p_id: string;
        name: string;
        latitude?: string | number;
        longitude?: string | number;
        lat?: string | number;
        lng?: string | number;
      }

      // 각 약국의 좌표 로깅
      pharmacyList.forEach((pharmacy: PharmacyForLogging, index: number) => {
        const latValue = pharmacy.latitude ?? pharmacy.lat ?? 0;
        const lngValue = pharmacy.longitude ?? pharmacy.lng ?? 0;
        const lat =
          typeof latValue === "string"
            ? parseFloat(latValue)
            : Number(latValue);
        const lng =
          typeof lngValue === "string"
            ? parseFloat(lngValue)
            : Number(lngValue);

        console.log(`📌 [Pharmacy ${index + 1}] Coordinates:`, {
          p_id: pharmacy.p_id,
          name: pharmacy.name,
          latitude: lat,
          longitude: lng,
          hasNegative: lat < 0 || lng < 0,
          rawLatitude: pharmacy.latitude,
          rawLongitude: pharmacy.longitude,
          rawLat: pharmacy.lat,
          rawLng: pharmacy.lng,
          rawTypes: {
            latitude: typeof pharmacy.latitude,
            longitude: typeof pharmacy.longitude,
            lat: typeof pharmacy.lat,
            lng: typeof pharmacy.lng,
          },
        });
      });

      if (!Array.isArray(pharmacyList)) {
        console.error(
          "❌ [API Error] Invalid response format - expected array:",
          data
        );
        return rejectWithValue("API response's data property is not an array");
      }

      const pharmaciesWithUser = await Promise.all(
        pharmacyList.map(async (pharmacy) => {
          try {
            const userResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pha_user/${pharmacy.p_id}`
            );
            if (!userResponse.ok) return { ...pharmacy, user: null };

            const userData = await userResponse.json();
            // API에서 user 정보가 data.data로 내려온다면
            const user = userData?.data ?? null;

            return {
              ...pharmacy,
              latitude: pharmacy.latitude || pharmacy.lat || 0,
              longitude: pharmacy.longitude || pharmacy.lng || 0,
              user,
            };
          } catch (error) {
            console.error(
              `Error fetching user data for pharmacy ${pharmacy.p_id}:`,
              error
            );
            return {
              ...pharmacy,
              latitude: pharmacy.latitude || pharmacy.lat || 0,
              longitude: pharmacy.longitude || pharmacy.lng || 0,
              user: null,
            };
          }
        })
      );

      return pharmaciesWithUser;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "약국 정보를 불러오는 데 실패했습니다.";
      return rejectWithValue(errorMessage);
    }
  }
);

interface PharmacyState {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastLocation: { lat: number; lng: number } | null;
}

const initialState: PharmacyState = {
  pharmacies: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  lastLocation: null,
};

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    setPharmacies: (
      state,
      action: PayloadAction<{
        pharmacies: PharmacyWithUser[];
        location?: { lat: number; lng: number };
      }>
    ) => {
      state.pharmacies = action.payload.pharmacies;
      state.lastFetched = Date.now();
      if (action.payload.location) {
        state.lastLocation = action.payload.location;
      }
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyPharmacies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyPharmacies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pharmacies = action.payload;
        state.lastFetched = Date.now();
        if (action.meta?.arg) {
          state.lastLocation = {
            lat: action.meta.arg.lat,
            lng: action.meta.arg.lng,
          };
        }
      })
      .addCase(fetchNearbyPharmacies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addMatcher(
        (
          action
        ): action is { type: string; payload: { pharmacy?: PharmacyState } } =>
          action.type === "persist/REHYDRATE" && action.payload?.pharmacy,
        (state, action) => {
          console.log("Rehydrating pharmacy state:", action.payload.pharmacy);
          const persistedState = action.payload.pharmacy;

          // Only update state if we have valid persisted data
          if (persistedState) {
            // Preserve the existing state and merge with persisted state
            return {
              ...state,
              ...persistedState,
              // Don't override loading/error states with potentially stale data
              isLoading: state.isLoading,
              error: state.error,
              // Only update pharmacies if we have a valid array
              pharmacies:
                Array.isArray(persistedState.pharmacies) &&
                persistedState.pharmacies.length > 0
                  ? persistedState.pharmacies
                  : state.pharmacies,
            };
          }
          return state;
        }
      );
  },
});

export const { setPharmacies } = pharmacySlice.actions;
export default pharmacySlice.reducer;
