import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckUsernameExistMutation, useRegisterUserMutation } from "../store";
import { useLocale } from "../hooks";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{4,20}$/;
const NICKNAME_MAX_LENGTH = 30;

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
            !USERNAME_PATTERN.test(username) ||
            password.length < 8 ||
            nickname.trim() === "" ||
            nickname.trim().length > NICKNAME_MAX_LENGTH ||
            email.trim() === ""
        ) {
            setError(t.auth.validationError);
            return;
        }

        try {
            await registerUser({ username, password, nickname, email }).unwrap();
            navigate("/login");
        } catch (err: unknown) {
            const errorData = (err as { data?: { code?: string } })?.data;
            const code = errorData?.code;

            if (code === "client.request.validate.conflict") {
                setError(t.auth.usernameTaken);
            } else if (code === "client.request.validate.email_conflict") {
                setError(t.auth.emailConflict);
            } else if (code === "client.request.rate_limit.exceeded") {
                setError(t.auth.rateLimitExceeded);
            } else {
                setError(t.auth.registerError);
            }
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
                    autoComplete="username"
                    required
                    minLength={4}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_-]{4,20}"
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={32}
                />
                <p className="form-hint">{t.auth.passwordHint}</p>

                <label htmlFor="join-nickname">{t.user.nickname}</label>
                <input
                    id="join-nickname"
                    type="text"
                    placeholder={t.auth.nicknamePlaceholder}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    maxLength={30}
                />

                <label htmlFor="join-email">{t.user.email}</label>
                <input
                    id="join-email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
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
