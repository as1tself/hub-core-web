// src/util/fetchUtil.ts
type ApiResponse<T> = {
    timestamp: string;
    requestId: string;
    status: number;
    code: string;
    message: string;
    path: string;
    result: T;
};

type TokenResponse = {
    accessToken: string;
    refreshToken: string | null;
};

export async function refreshAccessToken(): Promise<string> {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 쿠키 기반 refresh-token
    });

    if (!response.ok) throw new Error("AccessToken 갱신 실패");

    const data: ApiResponse<TokenResponse> = await response.json();

    const { accessToken, refreshToken } = data.result;
    console.log(refreshToken);
    console.clear();

    // AccessToken은 무조건 저장
    localStorage.setItem("accessToken", accessToken);

    // RefreshToken이 응답에 있을 경우에만 업데이트
    // if (refreshToken) {
    //     localStorage.setItem("refreshToken", refreshToken);
    // }

    return accessToken;
}

export async function fetchWithAccess(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = new Headers(options.headers ?? undefined);

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        try {
            console.warn("401 감지 → AccessToken 갱신 시도");
            const newAccess = await refreshAccessToken();
            headers.set("Authorization", `Bearer ${newAccess}`);
            response = await fetch(url, { ...options, headers });
        } catch (err) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            throw err;
        }
    }

    if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
    }

    return response;
}
