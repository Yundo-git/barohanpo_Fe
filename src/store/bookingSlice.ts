import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Reservation, CancelItem } from "@/types/reservation";

export const fetchReservations = createAsyncThunk<
  Reservation[],
  { userId: number },
  { rejectValue: string }
>("booking/fetchReservations", async ({ userId }, { rejectWithValue }) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books`,
      { cache: "no-store" }
    );
    if (!res.ok) return rejectWithValue("Failed to fetch reservations");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return rejectWithValue(msg);
  }
});

export const fetchCancelList = createAsyncThunk<
  CancelItem[],
  { userId: number },
  { rejectValue: string }
>("booking/fetchCancelList", async ({ userId }, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reservation/${userId}/books/cancel/list`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    if (!response.ok)
      return rejectWithValue(`Failed to fetch cancel list: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result)) return result as CancelItem[];
    if (result && Array.isArray(result.data))
      return result.data as CancelItem[];
    return [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return rejectWithValue(msg);
  }
});

interface BookingState {
  reservations: Reservation[];
  cancelList: CancelItem[];
  isLoading: boolean;
  error: string | null;
  lastFetchedUserId: number | null;
}

const initialState: BookingState = {
  reservations: [],
  cancelList: [],
  isLoading: false,
  error: null,
  lastFetchedUserId: null,
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    clearBookingState: (state) => {
      state.reservations = [];
      state.cancelList = [];
      state.isLoading = false;
      state.error = null;
      state.lastFetchedUserId = null;
    },
    setReservations: (state, action: PayloadAction<Reservation[]>) => {
      state.reservations = action.payload;
    },
    setCancelList: (state, action: PayloadAction<CancelItem[]>) => {
      state.cancelList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch reservations";
      })
      .addCase(fetchCancelList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCancelList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelList = action.payload;
      })
      .addCase(fetchCancelList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch cancel list";
      });
  },
});

export const { clearBookingState, setReservations, setCancelList } =
  bookingSlice.actions;
export default bookingSlice.reducer;

