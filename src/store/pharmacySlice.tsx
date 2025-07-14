// store/pharmacySlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Pharmacy } from "@/types/pharmacy";

interface PharmacyState {
  pharmacies: Pharmacy[];
}

const initialState: PharmacyState = {
  pharmacies: [],
};

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    setPharmacies(state, action: PayloadAction<Pharmacy[]>) {
      state.pharmacies = action.payload;
    },
  },
});

export const { setPharmacies } = pharmacySlice.actions;
export default pharmacySlice.reducer;
