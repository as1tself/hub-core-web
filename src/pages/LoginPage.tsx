// src/pages/LoginPage.tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser, useLazyGetUserQuery, useLoginMutation } from "../store";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const dispatch = useDispatch();

    const [triggerGetUser] = useLazyGetUserQuery();
    const [login] = useLoginMutation();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // setError("") 제거 - 깜빡임 방지 (새 에러 발생 시 덮어씀)

        // (1) precheck: 이미 로그인 되어 있는지 확인
        // baseQueryWithReauth가 토큰 재발급을 자동으로 처리함
        try {
            await triggerGetUser().unwrap();
            // 성공하면 이미 로그인됨 - setUser는 userApi의 onQueryStarted에서 자동 처리
            location.replace("/user");
            return;
        } catch {
            // 실패하면 로그인 플로우 진행
        }

        // (2) 로그인 진행
        if (!username || !password) {
            setError("아이디와 비밀번호를 입력하세요.");
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
        } catch {
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
                        <label htmlFor="login-username">아이디</label>
                        <input
                            id="login-username"
                            type="text"
                            placeholder="아이디"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">비밀번호</label>
                        <input
                            id="login-password"
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
