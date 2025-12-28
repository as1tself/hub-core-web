import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExchangeTokenMutation, useLazyGetUserQuery } from "../store";

function CookiePage() {
    const navigate = useNavigate();
    const [exchangeToken] = useExchangeTokenMutation();
    const [triggerGetUser] = useLazyGetUserQuery();

    useEffect(() => {
        const handleSocialLogin = async () => {
            try {
                // 1) 소셜 쿠키 교환 → accessToken 발급 (HTTP-only 쿠키로 백엔드에서 설정됨)
                await exchangeToken().unwrap();

                // 2) 유저 정보 조회 → Redux 저장 (onQueryStarted에서 setUser 호출됨)
                await triggerGetUser().unwrap();

                navigate("/");
            } catch (err) {
                console.error("소셜 로그인 처리 실패:", err);
                navigate("/login");
            }
        };

        handleSocialLogin();
    }, [exchangeToken, triggerGetUser, navigate]);

    return <p>로그인 처리 중입니다...</p>;
}

export default CookiePage;
