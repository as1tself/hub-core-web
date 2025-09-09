// src/util/fetchUtil.ts
export async function refreshAccessToken(): Promise<string> {
    // const refreshToken = localStorage.getItem("refreshToken");
    // if (!refreshToken) throw new Error("RefreshToken이 없습니다.");

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //body: JSON.stringify({ refreshToken }),
        credentials: "include", // 서버가 쿠키도 보길 원하면 주석 해제
    });

    if (!response.ok) throw new Error("AccessToken 갱신 실패");

    const data: { accessToken: string; refreshToken: string } = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    return data.accessToken;
}

export async function fetchWithAccess(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    // Headers는 불변처럼 다루는 게 안전: 기존 headers로 새 Headers 생성
    const headers = new Headers(options.headers ?? undefined);

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        try {
            alert("401감지")
            const newAccess = await refreshAccessToken();
            headers.set("Authorization", `Bearer ${newAccess}`);
            response = await fetch(url, { ...options, headers });
        } catch (err) {
            // 리프레시 실패 → 토큰 정리 후 로그인으로
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            throw err;
        }
    }

    if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
    }

    return response;
}
