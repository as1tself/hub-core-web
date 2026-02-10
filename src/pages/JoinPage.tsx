import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckUsernameExistMutation, useRegisterUserMutation } from "../store";
import { useLocale } from "../hooks";

function JoinPage() {
    const navigate = useNavigate();
    const { t } = useLocale();

    useEffect(() => {
        document.title = `${t.auth.registerTitle} - My App`;
    }, [t]);

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
            setError(t.auth.validationError);
            return;
        }

        try {
            await registerUser({ username, password, nickname, email }).unwrap();
            navigate("/login");
        } catch {
            setError(t.auth.registerError);
        }
    };

    // 페이지
    return (
        <div>
            <h1>{t.auth.registerTitle}</h1>

            <form onSubmit={handleSignUp}>
                <label htmlFor="join-username">{t.auth.username}</label>
                <input
                    id="join-username"
                    type="text"
                    placeholder={t.auth.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={4}
                />
                {username.length >= 4 && isUsernameValid === false && (
                    <p role="alert">{t.auth.usernameTaken}</p>
                )}
                {username.length >= 4 && isUsernameValid === true && (
                    <p role="status">{t.auth.usernameAvailable}</p>
                )}

                <label htmlFor="join-password">{t.auth.password}</label>
                <input
                    id="join-password"
                    type="password"
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                />

                <label htmlFor="join-nickname">{t.user.nickname}</label>
                <input
                    id="join-nickname"
                    type="text"
                    placeholder={t.auth.nicknamePlaceholder}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                />

                <label htmlFor="join-email">{t.user.email}</label>
                <input
                    id="join-email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                {error && <p role="alert">{error}</p>}

                <button type="submit" disabled={isUsernameValid !== true || isRegistering}>
                    {isRegistering ? t.auth.registering : t.common.register}
                </button>
            </form>
        </div>
    );
}

export default JoinPage;
