import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Review } from "@/types/review";

export const fetchUserReviews = createAsyncThunk<
  Review[],
  { userId: number },
  { rejectValue: string }
>("userReviews/fetch", async ({ userId }, { rejectWithValue }) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${userId}`
    );
    if (!res.ok)
      return rejectWithValue(res.statusText || "Failed to fetch reviews");
    const data = await res.json();
    const reviews: Review[] = Array.isArray(data?.data) ? data.data : [];
    return reviews;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return rejectWithValue(msg);
  }
});

interface UserReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserReviewsState = {
  reviews: [],
  isLoading: false,
  error: null,
};

const userReviewsSlice = createSlice({
  name: "userReviews",
  initialState,
  reducers: {
    setUserReviews: (state, action: PayloadAction<Review[]>) => {
      state.reviews = action.payload;
    },
    clearUserReviews: (state) => {
      state.reviews = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch user reviews";
      });
  },
});

export const { setUserReviews, clearUserReviews } = userReviewsSlice.actions;
export default userReviewsSlice.reducer;
