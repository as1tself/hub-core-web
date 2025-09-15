// src/pages/LoginPage.tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const dispatch = useDispatch();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        // ✅ (1) 로그인 전에 /user 먼저 조회 시도 (기존 유지)
        try {
            const accessToken = localStorage.getItem("accessToken");
            const precheck = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });

            if (precheck.ok) {
                // 이미 로그인되어 있음 → 유저 정보 저장 후 /user 페이지로
                const data = await precheck.json(); // ApiResponse<User>
                dispatch(setUser(data.result));
                location.replace("/user");
                return; // ✅ 로그인 절차 생략
            }

            // 401 & 토큰 만료 코드면 refresh → 재시도
            if (precheck.status === 401) {
                const errJson: any = await precheck.json().catch(() => null);
                if (errJson?.code === "client.request.jwt.expired") {
                    // refresh
                    const refreshRes = await fetch(`${BACKEND_API_BASE_URL}/auth/refresh`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" }, // Authorization 없이
                    });

                    if (refreshRes.ok) {
                        const refreshData: any = await refreshRes.json(); // ApiResponse<{accessToken:string}>
                        const newToken = refreshData?.result?.accessToken;
                        if (newToken) localStorage.setItem("accessToken", newToken);

                        // /user 재조회
                        const retry = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                                ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
                            },
                        });

                        if (retry.ok) {
                            const userData = await retry.json(); // ApiResponse<User>
                            dispatch(setUser(userData.result));
                            location.replace("/user");
                            return; // ✅ 로그인 절차 생략
                        }
                    } else {
                        // refresh 실패 시 기존 로그인 흐름 진행
                        localStorage.removeItem("accessToken");
                    }
                }
            }
        } catch {
            // 선조회 실패해도 로그인 플로우 진행
        }

        // ✅ (2) 기존 로그인 플로우 — 변경/삭제 없음
        if (!username || !password) {
            setError("아이디와 비밀번호를 입력하세요.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) throw new Error("로그인 실패");

            const data: { accessToken: string } = await res.json();
            localStorage.setItem("accessToken", data.accessToken);

            // ✅ (추가) 로그인 성공 직후 /user 호출 → 유저 데이터 저장
            try {
                // 1차 /user 조회
                let userRes = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.accessToken}`,
                    },
                });

                // 만료라면 refresh → accessToken 갱신 후 재시도
                if (!userRes.ok && userRes.status === 401) {
                    const body = await userRes.json().catch(() => null);
                    if (body?.code === "client.request.jwt.expired") {
                        const ref = await fetch(`${BACKEND_API_BASE_URL}/auth/refresh`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" }, // Authorization 없이
                        });

                        if (ref.ok) {
                            const refData: any = await ref.json();
                            const newToken = refData?.result?.accessToken;
                            if (newToken) localStorage.setItem("accessToken", newToken);

                            userRes = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                                method: "GET",
                                credentials: "include",
                                headers: {
                                    "Content-Type": "application/json",
                                    ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
                                },
                            });
                        }
                    }
                }

                if (userRes.ok) {
                    const userData = await userRes.json(); // ApiResponse<User>
                    dispatch(setUser(userData.result));   // ✅ 실제 유저 정보 저장
                } else {
                    // /user 조회가 끝내 실패해도 최소 username은 유지 (기존 동작 보존)
                    dispatch(setUser({ username }));
                }
            } catch {
                // /user 호출 중 문제 시 최소 username 저장 (기존 동작 보존)
                dispatch(setUser({ username }));
            }

            // 페이지 이동
            location.replace("/user");
        } catch (err) {
            console.error(err);
            setError("아이디 또는 비밀번호가 틀렸습니다.");
        }
    };

    const handleSocialLogin = (provider: string) => {
        window.location.href = `${BACKEND_API_BASE_URL}/oauth2/authorization/${provider}`;
    };

    return (
        <div>
            <h1>로그인</h1>
            <form onSubmit={handleLogin}>
                <label>아이디</label>
                <input
                    type="text"
                    placeholder="아이디"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <label>비밀번호</label>
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p>{error}</p>}

                <button type="submit">계속</button>
            </form>

            {/* 소셜 로그인 버튼 */}
            <div>
                <button onClick={() => handleSocialLogin("google")}>Google로 계속하기</button>
                <button onClick={() => handleSocialLogin("naver")}>Naver로 계속하기</button>
            </div>
        </div>
    );
}

export default LoginPage;
