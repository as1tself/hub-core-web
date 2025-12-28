import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckUsernameExistMutation, useRegisterUserMutation } from "../store";

function JoinPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = '회원가입 - My App';
    }, []);

    // 회원가입 변수
    const [username, setUsername] = useState<string>("");
    const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null); // null: 검사 전, true: 사용 가능, false: 중복
    const [password, setPassword] = useState<string>("");
    const [nickname, setNickname] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [error, setError] = useState<string>("");

    // RTK Query mutations
    const [checkUsernameExist] = useCheckUsernameExistMutation();
    const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();

    // username 입력창 변경 이벤트 (300ms 디바운스)
    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 4) {
                setIsUsernameValid(null);
                return;
            }

            try {
                const exists = await checkUsernameExist({ username }).unwrap();
                setIsUsernameValid(!exists);
            } catch {
                setIsUsernameValid(null);
            }
        };

        const delay = setTimeout(checkUsername, 300);
        return () => clearTimeout(delay);
    }, [username, checkUsernameExist]);

    // 회원 가입 이벤트
    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (
            username.length < 4 ||
            password.length < 4 ||
            nickname.trim() === "" ||
            email.trim() === ""
        ) {
            setError(
                "입력값을 다시 확인해주세요. (모든 항목은 필수이며, ID/비밀번호는 최소 4자)"
            );
            return;
        }

        try {
            await registerUser({ username, password, nickname, email }).unwrap();
            navigate("/login");
        } catch {
            setError("회원가입 중 오류가 발생했습니다.");
        }
    };

    // 페이지
    return (
        <div>
            <h1>회원 가입</h1>

            <form onSubmit={handleSignUp}>
                <label htmlFor="join-username">아이디</label>
                <input
                    id="join-username"
                    type="text"
                    placeholder="아이디 (4자 이상)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={4}
                />
                {username.length >= 4 && isUsernameValid === false && (
                    <p role="alert">이미 사용 중인 아이디입니다.</p>
                )}
                {username.length >= 4 && isUsernameValid === true && (
                    <p role="status">사용 가능한 아이디입니다.</p>
                )}

                <label htmlFor="join-password">비밀번호</label>
                <input
                    id="join-password"
                    type="password"
                    placeholder="비밀번호 (4자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                />

                <label htmlFor="join-nickname">닉네임</label>
                <input
                    id="join-nickname"
                    type="text"
                    placeholder="닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                />

                <label htmlFor="join-email">이메일</label>
                <input
                    id="join-email"
                    type="email"
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                {error && <p role="alert">{error}</p>}

                <button type="submit" disabled={isUsernameValid !== true || isRegistering}>
                    {isRegistering ? "가입 중..." : "회원가입"}
                </button>
            </form>
        </div>
    );
}

export default JoinPage;
