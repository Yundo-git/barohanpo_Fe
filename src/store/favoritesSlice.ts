import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoritesState {
  favoriteIds: number[];
}

const initialState: FavoritesState = {
  favoriteIds: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoriteIds: (state, action: PayloadAction<number[]>) => {
      state.favoriteIds = action.payload;
    },
    addFavorite: (state, action: PayloadAction<number>) => {
      if (!state.favoriteIds.includes(action.payload)) {
        state.favoriteIds.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      state.favoriteIds = state.favoriteIds.filter(id => id !== action.payload);
    },
  },
});

export const { setFavoriteIds, addFavorite, removeFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;