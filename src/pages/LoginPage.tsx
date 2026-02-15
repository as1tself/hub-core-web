// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, useLazyGetUserQuery, useLoginMutation } from "../store";
import { useLocale, useAppSelector } from "../hooks";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

function LoginPage() {
    const { t } = useLocale();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const dispatch = useDispatch();
    const user = useAppSelector((state) => state.user.user);

    useEffect(() => {
        document.title = `${t.auth.loginTitle} - My App`;
    }, [t]);

    // 이미 로그인되어 있으면 리다이렉트 (Redux 상태로 확인, API 호출 없음)
    useEffect(() => {
        if (user) {
            location.replace("/user");
        }
    }, [user]);

    const [triggerGetUser] = useLazyGetUserQuery();
    const [login] = useLoginMutation();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 로그인 진행
        if (!username || !password) {
            setError(t.auth.enterCredentials);
            return;
        }

        try {
            // 로그인 API 호출 - accessToken 저장은 onQueryStarted에서 자동 처리
            await login({ username, password }).unwrap();

            // 로그인 성공 후 /user 조회
            try {
                await triggerGetUser().unwrap();
                // setUser는 userApi의 onQueryStarted에서 자동 처리
            } catch {
                // user 조회 실패 시 기본값으로 설정 (비정상 케이스)
                dispatch(setUser({ username, nickname: "", email: "", social: false }));
            }

            location.replace("/user");
        } catch (err: unknown) {
            const errorData = (err as { data?: { code?: string } })?.data;
            const code = errorData?.code;

            if (code === "auth.account.locked") {
                setError(t.auth.accountLocked);
            } else if (code === "client.request.rate_limit.exceeded") {
                setError(t.auth.rateLimitExceeded);
            } else {
                setError(t.auth.wrongCredentials);
            }
        }
    };

    const ALLOWED_PROVIDERS = ["google", "naver"] as const;

    const handleSocialLogin = (provider: string) => {
        if (!(ALLOWED_PROVIDERS as readonly string[]).includes(provider)) return;
        window.location.href = `${BACKEND_API_BASE_URL}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">{t.auth.loginTitle}</h1>
                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="login-username">{t.auth.username}</label>
                        <input
                            id="login-username"
                            type="text"
                            placeholder={t.auth.username}
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">{t.auth.password}</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder={t.auth.password}
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <p className="login-error" role="alert">{error}</p>}

                    <button type="submit" className="btn btn--primary">{t.common.continue}</button>
                </form>

                <div className="divider">{t.common.or}</div>

                <div className="social-row">
                    <button onClick={() => handleSocialLogin("google")} className="social-btn">
                        {t.auth.continueWithGoogle}
                    </button>
                    <button onClick={() => handleSocialLogin("naver")} className="social-btn">
                        {t.auth.continueWithNaver}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
