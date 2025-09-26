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

        // (1) 기존 precheck 로직 그대로
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
                const data = await precheck.json();
                dispatch(setUser(data.result));
                location.replace("/user");
                return;
            }

            if (precheck.status === 401) {
                const errJson: any = await precheck.json().catch(() => null);
                if (errJson?.code === "client.request.jwt.expired") {
                    const refreshRes = await fetch(`${BACKEND_API_BASE_URL}/auth/refresh`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                    });

                    if (refreshRes.ok) {
                        const refreshData: any = await refreshRes.json();
                        const newToken = refreshData?.result?.accessToken;
                        if (newToken) localStorage.setItem("accessToken", newToken);

                        const retry = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                                ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
                            },
                        });

                        if (retry.ok) {
                            const userData = await retry.json();
                            dispatch(setUser(userData.result));
                            location.replace("/user");
                            return;
                        }
                    } else {
                        localStorage.removeItem("accessToken");
                    }
                }
            }
        } catch {
            // 무시 → 로그인 플로우 진행
        }

        // (2) 기존 로그인 로직
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

            // 로그인 성공 후 /user 조회
            try {
                let userRes = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.accessToken}`,
                    },
                });

                if (!userRes.ok && userRes.status === 401) {
                    const body = await userRes.json().catch(() => null);
                    if (body?.code === "client.request.jwt.expired") {
                        const ref = await fetch(`${BACKEND_API_BASE_URL}/auth/refresh`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
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
                    const userData = await userRes.json();
                    dispatch(setUser(userData.result));
                } else {
                    dispatch(setUser({ username }));
                }
            } catch {
                dispatch(setUser({ username }));
            }

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
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">로그인</h1>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>아이디</label>
                        <input
                            type="text"
                            placeholder="아이디"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="btn btn--primary">계속</button>
                </form>

                <div className="divider">또는</div>

                <div className="social-row">
                    <button onClick={() => handleSocialLogin("google")} className="social-btn">
                        Google로 계속하기
                    </button>
                    <button onClick={() => handleSocialLogin("naver")} className="social-btn">
                        Naver로 계속하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
