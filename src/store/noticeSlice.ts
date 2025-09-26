import { createSlice } from "@reduxjs/toolkit";

interface NoticeState {
    hasNotice: boolean;
}

const initialState: NoticeState = {
    hasNotice: false,
};

const noticeSlice = createSlice({
    name: "notice",
    initialState,
    reducers: {
        setNotice: (state, action) => {
            state.hasNotice = action.payload;
        },
        clearNotice: (state) => {
            state.hasNotice = false;
        },
    },
});

export const { setNotice, clearNotice } = noticeSlice.actions;
export default noticeSlice.reducer;
