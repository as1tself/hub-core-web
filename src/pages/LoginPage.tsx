import { useState } from "react";

// .env로 부터 백엔드 URL 받아오기
const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

function LoginPage() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

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

            // 서버는 { accessToken }만 JSON으로 반환 (refreshToken은 HttpOnly 쿠키로 옴)
            const data: { accessToken: string } = await res.json();

            // 원하는 저장 위치에 accessToken만 저장 (예: 메모리/컨텍스트가 더 안전)
            localStorage.setItem("accessToken", data.accessToken); // 필요시 메모리/Context로 대체

            // 다음 페이지로 이동
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
