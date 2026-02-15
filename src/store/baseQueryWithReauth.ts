// src/store/baseQueryWithReauth.ts
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { setEncryptedAccessToken, clearAccessToken } from "./slices/authSlice";
import { clearUser } from "./slices/userSlice";
import { showToast } from "./slices/noticeSlice";
import type { ApiResponse, LoginResponse } from "../types";
import { dpopClient, type EncryptedToken } from "../lib/dpop";
import { translations } from "../i18n";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

/**
 * 토큰을 암호화하여 반환
 * - 저장 직전에 암호화
 *
 * 참고: decryptAccessToken()은 삭제됨
 * - 보안상 평문 토큰을 외부로 노출하지 않음
 * - 대신 dpopClient.createAuthHeaders() 사용
 */
async function encryptAccessToken(token: string): Promise<EncryptedToken> {
    return await dpopClient.encryptToken(token);
}

// 인증 스킵 엔드포인트
const AUTH_SKIP_ENDPOINTS = ["exchangeToken", "login", "registerUser", "checkUsernameExist", "logout"];

// Mutex 상태 (동시 요청 방지용)
let refreshPromise: Promise<string | null> | null = null;

// 토큰 만료 여유 시간 (초) - 만료 10초 전에 미리 갱신
const TOKEN_EXPIRY_BUFFER_SECONDS = 10;

// 참고: getTokenExpiry(), isTokenExpiredOrExpiring() 함수는 삭제됨
// - 보안상 평문 토큰을 외부로 노출하지 않음
// - 대신 dpopClient.isTokenExpiring() 사용

/**
 * 에러 코드 → 번역 키 매핑
 */
const TOKEN_ERROR_KEY_MAP: Record<string, keyof typeof translations.ko.tokenError> = {
    "auth.token.already_rotated": "alreadyRotated",
    "auth.session.invalidated": "sessionInvalidated",
    "auth.token.reuse_detected": "reuseDetected",
};

/**
 * 에러 응답에서 에러 코드 추출
 */
function extractErrorCode(errorData: unknown): string | null {
    if (!errorData || typeof errorData !== "object") return null;

    // ApiResponse 형식: { code: "..." }
    if ("code" in errorData && typeof (errorData as { code: unknown }).code === "string") {
        return (errorData as { code: string }).code;
    }

    return null;
}

/**
 * 에러 코드에 따른 사용자 알림 표시 (Toast + i18n)
 */
function showTokenErrorToast(
    errorCode: string | null,
    dispatch: (action: ReturnType<typeof showToast>) => void,
    getState: () => RootState
): void {
    const locale = getState().locale.resolvedLocale;
    const t = translations[locale].tokenError;

    const translationKey = errorCode ? TOKEN_ERROR_KEY_MAP[errorCode] : null;
    const message = translationKey ? t[translationKey] : t.unknown;

    console.warn(`[TokenError] ${errorCode ?? "unknown"}: ${message}`);
    dispatch(showToast({ message, type: "error" }));
}

// 참고: dpopFetch() 함수는 삭제됨
// - 보안상 평문 토큰을 외부로 노출하지 않음
// - 대신 dpopClient.createAuthHeaders() 또는 dpopClient.createProof() 직접 사용

/**
 * DPoP 헤더를 포함한 baseQuery
 *
 * ## 보안: 평문 토큰이 절대 외부로 노출되지 않음!
 * - authenticatedFetch()가 fetch까지 캡슐화
 * - 평문 토큰은 dpopClient 내부에서만 존재
 * - XSS로 이 모듈을 import해도 토큰 탈취 불가
 */
const baseQueryWithDPoP: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api) => {
    // args 정규화
    const { url: rawUrl, method = "GET", body, headers: argsHeaders } = typeof args === "string"
        ? { url: args, method: "GET", body: undefined, headers: undefined }
        : args;

    const fullUrl = `${BACKEND_API_BASE_URL}${rawUrl}`;
    const state = api.getState() as RootState;
    const encryptedToken = state.auth.encryptedAccessToken;
    const endpoint = api.endpoint;
    const needsAuth = !AUTH_SKIP_ENDPOINTS.includes(endpoint ?? "");

    try {
        // DPoP 초기화
        await dpopClient.init();

        let response: Response;

        if (needsAuth && encryptedToken) {
            // 보안: authenticatedFetch()가 토큰 복호화부터 fetch까지 캡슐화
            // 평문 토큰은 dpopClient 내부에서만 존재하고 절대 외부로 노출되지 않음
            const headers = new Headers(argsHeaders as HeadersInit);
            headers.set("Content-Type", "application/json");

            response = await dpopClient.authenticatedFetch(encryptedToken, fullUrl, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                credentials: "include",
            });
        } else {
            // 인증 불필요: ath 없이 DPoP Proof만 생성
            const headers = new Headers(argsHeaders as HeadersInit);
            headers.set("Content-Type", "application/json");
            const proof = await dpopClient.createProof(method, fullUrl);
            headers.set("X-Proof", proof);

            response = await fetch(fullUrl, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                credentials: "include",
            });
        }

        const contentType = response.headers.get("content-type");
        let data: unknown;
        if (contentType?.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return {
                error: {
                    status: response.status,
                    data,
                } as FetchBaseQueryError,
            };
        }

        return { data };
    } catch (error) {
        return {
            error: {
                status: "FETCH_ERROR",
                error: String(error),
            } as FetchBaseQueryError,
        };
    }
};

/**
 * DPoP Proof를 포함한 refresh 전용 baseQuery
 *
 * ## 토큰 갱신 시 ath 불필요
 * /auth/refresh 호출 시에는 Access Token이 아직 없으므로
 * ath 클레임을 포함하지 않습니다 (RFC 9449 Section 4.2).
 *
 * 서버는 DPoP Proof의 다른 항목들(htm, htu, iat, jkt 등)만 검증합니다.
 */
const baseQueryNoAuthWithDPoP: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args) => {
    const { url: rawUrl, method = "GET", body, headers: argsHeaders } = typeof args === "string"
        ? { url: args, method: "GET", body: undefined, headers: undefined }
        : args;

    const fullUrl = `${BACKEND_API_BASE_URL}${rawUrl}`;

    const headers = new Headers(argsHeaders as HeadersInit);
    headers.set("Content-Type", "application/json");

    try {
        // DPoP 초기화 및 Proof 생성 (ath 없음)
        await dpopClient.init();
        const proof = await dpopClient.createProof(method, fullUrl);
        headers.set("X-Proof", proof);

        const response = await fetch(fullUrl, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            credentials: "include",
        });

        const contentType = response.headers.get("content-type");
        let data: unknown;
        if (contentType?.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return {
                error: {
                    status: response.status,
                    data,
                } as FetchBaseQueryError,
            };
        }

        return { data };
    } catch (error) {
        return {
            error: {
                status: "FETCH_ERROR",
                error: String(error),
            } as FetchBaseQueryError,
        };
    }
};

export const baseQuery = baseQueryWithDPoP;

/**
 * Two-Phase Token Rotation - confirm 요청
 *
 * Phase 2: 새 토큰을 성공적으로 받은 후 서버에 확인 요청을 보냅니다.
 * 이 요청이 성공하면 서버에서 이전 토큰이 무효화됩니다.
 *
 * @param api - Redux API
 * @param extraOptions - 추가 옵션
 * @returns confirm 성공 여부
 */
async function doConfirm(
    api: Parameters<typeof baseQueryWithDPoP>[1],
    extraOptions: Parameters<typeof baseQueryWithDPoP>[2]
): Promise<boolean> {
    try {
        const confirmResult = await baseQueryNoAuthWithDPoP(
            { url: "/auth/confirm", method: "POST" },
            api,
            extraOptions
        );

        if ("error" in confirmResult) {
            console.warn("[TwoPhase] confirm 요청 실패 - 이전 토큰은 30초 후 자동 만료됩니다.");
            return false;
        }

        console.log("[TwoPhase] confirm 성공 - 이전 토큰 무효화 완료");
        return true;
    } catch (e) {
        console.warn("[TwoPhase] confirm 요청 중 오류:", e);
        return false;
    }
}

/**
 * Two-Phase Token Rotation - Phase 1 & 2
 *
 * Phase 1: /auth/refresh 요청 → 새 토큰 발급 (이전 토큰 유지)
 * Phase 2: /auth/confirm 요청 → 이전 토큰 무효화
 *
 * ## 새로고침 발생 시
 * - Phase 1 후 새로고침 → 이전 토큰 아직 유효 → 재시도 가능
 * - Phase 2(confirm)이 실패해도 → 30초 후 자동 정리
 */
async function doRefresh(
    api: Parameters<typeof baseQueryWithDPoP>[1],
    extraOptions: Parameters<typeof baseQueryWithDPoP>[2]
): Promise<string | null> {
    // 이미 진행 중인 refresh가 있으면 그 결과를 기다림 (동시 요청 방지)
    if (refreshPromise) {
        return refreshPromise;
    }

    // 새 refresh 시작
    refreshPromise = (async () => {
        try {
            // ========== Phase 1: 새 토큰 발급 ==========
            console.log("[TwoPhase] Phase 1 시작 - /auth/refresh");
            const refreshResult = await baseQueryNoAuthWithDPoP(
                { url: "/auth/refresh", method: "POST" },
                api,
                extraOptions
            );

            if ("error" in refreshResult || !refreshResult.data) {
                console.warn("[TwoPhase] Phase 1 실패 - 토큰 갱신 불가");

                // 에러 코드 추출 및 Toast 알림 (i18n 적용)
                const errorCode = extractErrorCode(refreshResult.error?.data);
                showTokenErrorToast(errorCode, api.dispatch, api.getState as () => RootState);

                api.dispatch(clearAccessToken());
                api.dispatch(clearUser());
                return null;
            }

            const { accessToken } = (refreshResult.data as ApiResponse<LoginResponse>).result;
            if (!accessToken) {
                console.warn("[TwoPhase] Phase 1 실패 - accessToken 없음");
                return null;
            }

            // 새 토큰 암호화 후 저장
            const encryptedToken = await encryptAccessToken(accessToken);
            api.dispatch(setEncryptedAccessToken(encryptedToken));
            console.log("[TwoPhase] Phase 1 완료 - 새 토큰 암호화 저장됨");

            // ========== Phase 2: 이전 토큰 무효화 (confirm) ==========
            // confirm은 비동기로 실행하고 결과를 기다리지 않아도 됨
            // 실패해도 30초 후 자동 만료되므로 사용자 경험에 영향 없음
            console.log("[TwoPhase] Phase 2 시작 - /auth/confirm");
            doConfirm(api, extraOptions).catch(() => {
                // confirm 실패는 무시 (30초 후 자동 정리)
            });

            return accessToken;
        } catch (e) {
            console.error("[TwoPhase] 토큰 재발급 중 오류:", e);
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
export const baseQueryWithReauth: typeof baseQueryWithDPoP = async (args, api, extraOptions) => {
    const isRefreshCall =
        typeof args === "object" &&
        args !== null &&
        "url" in args &&
        (args as { url?: string }).url?.includes("/auth/refresh");

    // refresh 요청 자체는 그냥 실행
    if (isRefreshCall) {
        return baseQueryWithDPoP(args, api, extraOptions);
    }

    const currentEndpoint = api.endpoint;
    const needsAuth = !AUTH_SKIP_ENDPOINTS.includes(currentEndpoint ?? "");

    // 인증이 필요한 요청이고 토큰이 만료되었거나 곧 만료될 예정이면 먼저 refresh 시도
    const state = api.getState() as RootState;
    const encryptedToken = state.auth.encryptedAccessToken;
    const hasUser = !!state.user.user;

    // 토큰 만료 체크 (보안: 평문 토큰을 외부로 노출하지 않고 만료 여부만 확인)
    if (needsAuth && hasUser && encryptedToken) {
        const isExpiring = await dpopClient.isTokenExpiring(encryptedToken, TOKEN_EXPIRY_BUFFER_SECONDS);
        if (isExpiring) {
            console.log("[Auth] 토큰 만료/만료 예정 - refresh 시작");
            await doRefresh(api, extraOptions);
        }
    } else if (needsAuth && hasUser && !encryptedToken) {
        // 토큰 없음 - refresh 시도
        console.log("[Auth] 토큰 없음 - refresh 시작");
        await doRefresh(api, extraOptions);
    }

    // 실제 요청 실행
    let result = await baseQueryWithDPoP(args, api, extraOptions);

    // 에러 처리
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

        // 429 Rate Limit 처리 (전역)
        if (status === 429) {
            const locale = (api.getState() as RootState).locale.resolvedLocale;
            api.dispatch(showToast({ message: translations[locale].auth.rateLimitExceeded, type: "error" }));
        }

        // 401 에러 처리
        const shouldRefresh = status === 401 || errorCode === "client.request.jwt.expired";

        if (shouldRefresh) {
            console.log("[Auth] 401 응답 - refresh 후 재요청");
            const newToken = await doRefresh(api, extraOptions);
            if (newToken) {
                // 새 토큰으로 재요청
                result = await baseQueryWithDPoP(args, api, extraOptions);
            }
        }
    }

    return result;
};
