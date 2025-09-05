import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export const fetchCompletedReviewIds = createAsyncThunk<
  number[],
  { userId: number },
  { rejectValue: string }
>("reviewCompletion/fetchIds", async ({ userId }, { rejectWithValue }) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${userId}/id`
    );
    if (!res.ok)
      return rejectWithValue(`Failed to fetch reviews: ${res.status}`);
    const json: unknown = await res.json();
    const raw = (json as { data?: unknown })?.data ?? json;
    const ids = Array.isArray(raw)
      ? raw
          .map((v) => {
            if (typeof v === "number") return v;
            if (
              v &&
              typeof v === "object" &&
              "book_id" in (v as Record<string, unknown>)
            ) {
              const id = (v as { book_id: number | string }).book_id;
              return typeof id === "string" ? Number(id) : id;
            }
            return NaN;
          })
          .filter((n) => Number.isFinite(n))
      : [];
    return ids as number[];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return rejectWithValue(msg);
  }
});

interface ReviewCompletionState {
  completedIds: number[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReviewCompletionState = {
  completedIds: [],
  isLoading: false,
  error: null,
};

const reviewCompletionSlice = createSlice({
  name: "reviewCompletion",
  initialState,
  reducers: {
    setCompletedIds: (state, action: PayloadAction<number[]>) => {
      state.completedIds = action.payload;
    },
    clearCompletedIds: (state) => {
      state.completedIds = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompletedReviewIds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompletedReviewIds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.completedIds = action.payload;
      })
      .addCase(fetchCompletedReviewIds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch completed reviews";
      });
  },
});

export const { setCompletedIds, clearCompletedIds } =
  reviewCompletionSlice.actions;
export default reviewCompletionSlice.reducer;

