// src/store/baseQueryWithReauth.ts
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

// 일반 요청용: Authorization 헤더 자동 첨부
const baseQueryAuth = fetchBaseQuery({
    baseUrl: BACKEND_API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
        const token = localStorage.getItem("accessToken");
        if (token) headers.set("Authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");
        return headers;
    },
});

// refresh 전용: Authorization 헤더 제거
const baseQueryNoAuth = fetchBaseQuery({
    baseUrl: BACKEND_API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
        headers.set("Content-Type", "application/json");
        return headers;
    },
});

// (기존에 export 하던 baseQuery가 필요하다면 아래처럼 유지할 수 있음)
export const baseQuery = baseQueryAuth;

// wrapper
export const baseQueryWithReauth: typeof baseQueryAuth = async (args, api, extraOptions) => {
    // 일반 요청은 항상 baseQueryAuth 사용
    let result = await baseQueryAuth(args, api, extraOptions);

    // refresh 자체 요청에는 재시도/재발급 로직 적용하지 않음 (무한루프 방지)
    const isRefreshCall =
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        (args as any).url?.toString().includes("/auth/refresh");

    if (!isRefreshCall && result.error) {
        const status = Number(result.error.status);

        // 에러 바디에서 code를 안전하게 추출
        let errorCode: string | undefined;
        try {
            if (typeof result.error.data === "string") {
                const parsed = JSON.parse(result.error.data);
                errorCode = parsed?.code;
            } else if (result.error.data && typeof result.error.data === "object") {
                errorCode = (result.error.data as any).code;
            }
        } catch { /* no-op */ }

        // 401이면 무조건 refresh 시도 + 만료 코드도 커버
        const shouldRefresh = status === 401 || errorCode === "client.request.jwt.expired";

        if (shouldRefresh) {
            try {
                const refreshResult = await baseQueryNoAuth(
                    {
                        url: "/auth/refresh",
                        method: "POST",
                        credentials: "include",
                    },
                    api,
                    extraOptions
                );

                // 성공 케이스만 통과
                if ("error" in refreshResult || !refreshResult.data) {
                    console.error("refresh 실패 → 홈으로 이동");
                    localStorage.removeItem("accessToken");
                    window.location.href = "/";
                    return refreshResult;
                }

                // refreshResult.data 가 존재 → accessToken 추출
                const { accessToken } = (refreshResult.data as any).result || {};
                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                }

                // 원래 요청 재시도
                result = await baseQueryAuth(args, api, extraOptions);
            } catch (e) {
                console.error("토큰 재발급 중 오류:", e);
                localStorage.removeItem("accessToken");
                window.location.href = "/";
            }
        }
    }

    return result;
};
