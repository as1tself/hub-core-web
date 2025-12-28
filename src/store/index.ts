// src/store/index.ts
export { store, persistor } from "./store";
export type { RootState, AppDispatch } from "./store";

// APIs
export {
    userApi,
    useGetUserQuery,
    useLazyGetUserQuery,
    useLoginMutation,
    useCheckUsernameExistMutation,
    useRegisterUserMutation,
    useExchangeTokenMutation,
    useLogoutMutation,
} from "./apis/userApi";
export { apiHistoryApi, useGetApiHistoryQuery } from "./apis/apiHistoryApi";

// Slices
export { setUser, clearUser } from "./slices/userSlice";
export {
    showToast,
    hideToast,
    clearToasts,
    markAsRead,
    markAllAsRead,
    clearHistory,
    removeNotification,
} from "./slices/noticeSlice";
export type { ToastType } from "./slices/noticeSlice";
export { setAccessToken, clearAccessToken } from "./slices/authSlice";

// Types (re-export from types for convenience)
export type { User, ApiResponse, LoginRequest, LoginResponse } from "../types";
