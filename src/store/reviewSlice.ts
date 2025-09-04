import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Review } from "@/types/review";

export const fetchFiveStarReviews = createAsyncThunk<
  Review[],
  void,
  { rejectValue: string }
>("review/fetchFiveStar", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/fivestar`
    );
    if (!response.ok) {
      return rejectWithValue(
        `Failed to fetch 5-star reviews: ${response.statusText}`
      );
    }
    const data = await response.json();
    const reviews: Review[] = Array.isArray(data?.data) ? data.data : [];
    return reviews;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ReviewState = {
  reviews: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    setReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiveStarReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFiveStarReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchFiveStarReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch reviews";
      });
  },
});

export const { setReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
