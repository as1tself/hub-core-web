// src/store/userSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type User = {
    username: string;
    nickname?: string;
    email?: string;
    social?: boolean;
};

interface UserState {
    user: User | null;
}

const initialState: UserState = {
    user: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        },
        clearUser: (state) => {
            state.user = null;
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
