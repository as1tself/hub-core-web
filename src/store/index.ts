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
export { setEncryptedAccessToken, clearAccessToken } from "./slices/authSlice";
export {
    setTheme,
    toggleTheme,
    syncWithSystem,
    initializeTheme,
} from "./slices/themeSlice";
export type { ThemeMode } from "./slices/themeSlice";
export {
    setLocale,
    toggleLocale,
    syncWithSystem as syncLocaleWithSystem,
    initializeLocale,
} from "./slices/localeSlice";
export type { LocaleMode, ResolvedLocale } from "./slices/localeSlice";

// Types (re-export from types for convenience)
export type { User, ApiResponse, LoginRequest, LoginResponse } from "../types";
