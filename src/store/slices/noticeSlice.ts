import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "info" | "success" | "error";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface Notification {
    id: string;
    message: string;
    type: ToastType;
    timestamp: number;
    read: boolean;
}

interface NoticeState {
    // 토스트 메시지 스택 (화면에 표시)
    toasts: Toast[];
    // 알림 히스토리 (최대 20개)
    history: Notification[];
}

const MAX_HISTORY = 20;

const initialState: NoticeState = {
    toasts: [],
    history: [],
};

const noticeSlice = createSlice({
    name: "notice",
    initialState,
    reducers: {
        // 토스트 추가 (스택에 쌓임 + 히스토리에 저장)
        showToast: (state, action: PayloadAction<{ message: string; type?: ToastType }>) => {
            const id = Date.now().toString();
            const type = action.payload.type || "info";

            // 토스트에 추가
            state.toasts.push({
                id,
                message: action.payload.message,
                type,
            });

            // 히스토리에 추가 (앞에 추가, 최대 20개 유지)
            state.history.unshift({
                id,
                message: action.payload.message,
                type,
                timestamp: Date.now(),
                read: false,
            });

            // 20개 초과 시 오래된 것 제거
            if (state.history.length > MAX_HISTORY) {
                state.history = state.history.slice(0, MAX_HISTORY);
            }
        },
        // 특정 토스트 제거
        hideToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },
        // 모든 토스트 제거
        clearToasts: (state) => {
            state.toasts = [];
        },
        // 알림 읽음 처리
        markAsRead: (state, action: PayloadAction<string>) => {
            const notification = state.history.find((n) => n.id === action.payload);
            if (notification) {
                notification.read = true;
            }
        },
        // 모든 알림 읽음 처리
        markAllAsRead: (state) => {
            state.history.forEach((n) => {
                n.read = true;
            });
        },
        // 알림 히스토리 삭제
        clearHistory: (state) => {
            state.history = [];
        },
        // 특정 알림 삭제
        removeNotification: (state, action: PayloadAction<string>) => {
            state.history = state.history.filter((n) => n.id !== action.payload);
        },
    },
});

export const {
    showToast,
    hideToast,
    clearToasts,
    markAsRead,
    markAllAsRead,
    clearHistory,
    removeNotification,
} = noticeSlice.actions;

export default noticeSlice.reducer;
