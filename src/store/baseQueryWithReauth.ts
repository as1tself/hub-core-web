// src/store/baseQueryWithReauth.ts
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setAccessToken, clearAccessToken } from "./slices/authSlice";
import { clearUser } from "./slices/userSlice";
import type { ApiResponse, LoginResponse } from "../types";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

// Authorization 헤더에 accessToken을 담아서 전송
const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: BACKEND_API_BASE_URL,
    credentials: "include", // refresh token은 HTTP-only 쿠키로 전송
    prepareHeaders: (headers, { getState, endpoint }) => {
        // exchangeToken, login은 Authorization 헤더 제외
        const skipAuthEndpoints = ["exchangeToken", "login", "registerUser", "checkUsernameExist"];
        if (!skipAuthEndpoints.includes(endpoint)) {
            const token = (getState() as RootState).auth.accessToken;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
        }
        headers.set("Content-Type", "application/json");
        return headers;
    },
});

export const baseQuery = baseQueryWithAuth;

// 401 에러 시 자동 토큰 재발급 wrapper
export const baseQueryWithReauth: typeof baseQueryWithAuth = async (args, api, extraOptions) => {
    let result = await baseQueryWithAuth(args, api, extraOptions);

    // refresh 자체 요청에는 재시도 로직 적용하지 않음 (무한루프 방지)
    const isRefreshCall =
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        (args as { url?: string }).url?.includes("/auth/refresh");

    if (!isRefreshCall && result.error) {
        const status = Number(result.error.status);

        // 에러 바디에서 code를 안전하게 추출
        let errorCode: string | undefined;
        try {
            if (typeof result.error.data === "string") {
                const parsed = JSON.parse(result.error.data);
                errorCode = parsed?.code;
            } else if (result.error.data && typeof result.error.data === "object") {
                errorCode = (result.error.data as { code?: string }).code;
            }
        } catch { /* no-op */ }

        // 401이면 무조건 refresh 시도 + 만료 코드도 커버
        const shouldRefresh = status === 401 || errorCode === "client.request.jwt.expired";

        if (shouldRefresh) {
            try {
                // refresh 요청 (HTTP-only 쿠키로 자동 인증)
                const refreshResult = await baseQueryWithAuth(
                    { url: "/auth/refresh", method: "POST" },
                    api,
                    extraOptions
                );

                if ("error" in refreshResult || !refreshResult.data) {
                    console.error("refresh 실패");
                    api.dispatch(clearAccessToken());
                    api.dispatch(clearUser());
                    return result;
                }

                // 새 accessToken을 Redux에 저장
                const { accessToken } = (refreshResult.data as ApiResponse<LoginResponse>).result;
                if (accessToken) {
                    api.dispatch(setAccessToken(accessToken));
                }

                // 원래 요청 재시도
                result = await baseQueryWithAuth(args, api, extraOptions);
            } catch (e) {
                console.error("토큰 재발급 중 오류:", e);
                api.dispatch(clearAccessToken());
                api.dispatch(clearUser());
            }
        }
    }

    return result;
};
