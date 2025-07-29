// store/pharmacySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { PharmacyWithUser } from "@/types/pharmacy";

// Persist rehydration action type
type PersistRehydrateAction = {
  type: string;
  payload?: {
    pharmacy?: PharmacyState;
  };
  meta?: {
    arg?: {
      lat: number;
      lng: number;
    };
  };
};

// 비동기 Thunk 정의
export const fetchNearbyPharmacies = createAsyncThunk<
  PharmacyWithUser[], // 성공 시 반환될 타입
  { lat: number; lng: number; radius?: number }, // thunk에 전달될 인자 타입 (lng으로 수정, radius 추가)
  { rejectValue: string } // 실패 시 반환될 타입
>(
  "pharmacy/fetchNearby",
  async ({ lat, lng, radius = 8000 }, { rejectWithValue }) => {
    try {
      console.log(`Searching for pharmacies near lat: ${lat}, lng: ${lng}`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pharmacy/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const pharmacyList = Array.isArray(data) ? data : data?.data || [];
      console.log(`Found ${pharmacyList.length} pharmacies`);

      if (!Array.isArray(pharmacyList)) {
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
      .addCase("persist/REHYDRATE", (state, action: PersistRehydrateAction) => {
        // Handle rehydration
        if (action.payload?.pharmacy) {
          return { ...state, ...action.payload.pharmacy };
        }
        return state;
      });
  },
});

export const { setPharmacies } = pharmacySlice.actions;
export default pharmacySlice.reducer;
