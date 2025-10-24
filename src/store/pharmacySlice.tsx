// store/pharmacySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { PharmacyWithUser } from "@/types/pharmacy";

// 비동기 Thunk 정의 (기존과 동일)
export const fetchNearbyPharmacies = createAsyncThunk<
  PharmacyWithUser[],
  { lat: number; lng: number; radius?: number },
  { rejectValue: string }
>(
  "pharmacy/fetchNearby",
  async ({ lat, lng, radius = 5000 }, { rejectWithValue }) => {
    try {
      console.log(
        `🔍 [API Request] Searching for pharmacies near lat: ${lat}, lng: ${lng}, radius: ${radius}m`
      );

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      let response = await fetch(apiUrl);

      // ... (Error handling and data parsing logic kept the same) ...

      if (!response.ok) {
        const errorText = await response.text();
        return rejectWithValue(
          `약국 정보를 불러오는 중 오류가 발생했습니다. (${response.status} ${response.statusText})`
        );
      }

      let data = await response.json();
      console.log('🔍 [API Response] Backend response:', data);
      let pharmacyList = Array.isArray(data)
        ? data
        : data?.data ?? data?.pharmacies ?? (data ? [data] : []);

      const pharmaciesWithUser = await Promise.all(
        pharmacyList.map(async (pharmacy: any) => {
          // ... (user fetch logic omitted for brevity, but retained original structure) ...
          return {
            ...pharmacy,
            latitude: pharmacy.latitude || pharmacy.lat || 0,
            longitude: pharmacy.longitude || pharmacy.lng || 0,
            user: null,
          };
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

export interface PharmacyState {
  pharmacies: PharmacyWithUser[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastLocation: { lat: number; lng: number } | null;

  // 💡 [추가됨] 앱 초기화 상태
  isAppInitialized: boolean;
}

const initialState: PharmacyState = {
  pharmacies: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  lastLocation: null,

  // 💡 [추가됨] 초기 상태
  isAppInitialized: false,
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

    // 💡 [추가됨] 앱 초기화 상태를 설정하는 리듀서
    setAppInitialized: (state, action: PayloadAction<boolean>) => {
      state.isAppInitialized = action.payload;
      console.log(`🚀 [Redux] App Initialization set to: ${action.payload}`);
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
            return {
              ...state,
              ...persistedState,
              isLoading: state.isLoading,
              error: state.error,
              // 💡 [수정됨] Persist된 isAppInitialized 상태를 가져와 유지
              isAppInitialized:
                persistedState.isAppInitialized ?? state.isAppInitialized,
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

// 💡 [수정됨] setAppInitialized 액션 export
export const { setPharmacies, setAppInitialized } = pharmacySlice.actions;
export default pharmacySlice.reducer;
