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

// Mutex 상태
let refreshPromise: Promise<string | null> | null = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 5000; // 5초 내 재시도 방지

const AUTH_SKIP_ENDPOINTS = ["exchangeToken", "login", "registerUser", "checkUsernameExist"];

// 단일 refresh 함수 - 모든 refresh 요청은 이 함수를 통해서만
async function doRefresh(
    api: Parameters<typeof baseQueryWithAuth>[1],
    extraOptions: Parameters<typeof baseQueryWithAuth>[2]
): Promise<string | null> {
    // 이미 진행 중인 refresh가 있으면 그 결과를 기다림
    if (refreshPromise) {
        return refreshPromise;
    }

    // 최근에 refresh 성공했으면 현재 토큰 반환
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
        const state = api.getState() as RootState;
        return state.auth.accessToken;
    }

    // 새 refresh 시작
    refreshPromise = (async () => {
        try {
            const refreshResult = await baseQueryWithAuth(
                { url: "/auth/refresh", method: "POST" },
                api,
                extraOptions
            );

            if ("error" in refreshResult || !refreshResult.data) {
                api.dispatch(clearAccessToken());
                api.dispatch(clearUser());
                return null;
            }

            const { accessToken } = (refreshResult.data as ApiResponse<LoginResponse>).result;
            if (accessToken) {
                api.dispatch(setAccessToken(accessToken));
                lastRefreshTime = Date.now();
                return accessToken;
            }
            return null;
        } catch (e) {
            console.error("토큰 재발급 중 오류:", e);
            api.dispatch(clearAccessToken());
            api.dispatch(clearUser());
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// 401 에러 시 자동 토큰 재발급 wrapper
export const baseQueryWithReauth: typeof baseQueryWithAuth = async (args, api, extraOptions) => {
    const isRefreshCall =
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        (args as { url?: string }).url?.includes("/auth/refresh");

    // refresh 요청 자체는 그냥 실행
    if (isRefreshCall) {
        return baseQueryWithAuth(args, api, extraOptions);
    }

    const currentEndpoint = api.endpoint;
    const needsAuth = !AUTH_SKIP_ENDPOINTS.includes(currentEndpoint ?? "");

    // 토큰이 없고, 인증이 필요한 요청이면 먼저 refresh 시도
    const state = api.getState() as RootState;
    const hasToken = !!state.auth.accessToken;
    const hasUser = !!state.user.user;

    if (needsAuth && !hasToken && hasUser) {
        await doRefresh(api, extraOptions);
    }

    // 실제 요청 실행
    let result = await baseQueryWithAuth(args, api, extraOptions);

    // 401 에러 처리
    if (result.error) {
        const status = Number(result.error.status);

        let errorCode: string | undefined;
        try {
            if (typeof result.error.data === "string") {
                const parsed = JSON.parse(result.error.data);
                errorCode = parsed?.code;
            } else if (result.error.data && typeof result.error.data === "object") {
                errorCode = (result.error.data as { code?: string }).code;
            }
        } catch { /* no-op */ }

        const shouldRefresh = status === 401 || errorCode === "client.request.jwt.expired";

        if (shouldRefresh) {
            const newToken = await doRefresh(api, extraOptions);
            if (newToken) {
                // 새 토큰으로 재요청
                result = await baseQueryWithAuth(args, api, extraOptions);
            }
        }
    }

    return result;
};
