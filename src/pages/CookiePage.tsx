import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
import type {User, ApiResponse} from "../store/userApi";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

function CookiePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleSocialLogin = async () => {
            try {
                // 1) 소셜 쿠키 교환 → accessToken 발급
                const res = await fetch(`${BACKEND_API_BASE_URL}/auth/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (!res.ok) {
                    navigate("/login");
                    return;
                }

                const data = await res.json();
                const accessToken = data?.result?.accessToken;

                if (!accessToken) throw new Error("AccessToken 없음");

                // accessToken 저장
                localStorage.setItem("accessToken", accessToken);

                // 2) 유저 정보 조회 → Redux 저장
                const userRes = await fetch(`${BACKEND_API_BASE_URL}/user`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "include",
                });

                if (userRes.ok) {
                    const userData: ApiResponse<User> = await userRes.json();
                    dispatch(setUser(userData.result));
                    navigate("/");
                } else {
                    console.error("유저 정보 조회 실패");
                    navigate("/login");
                }
            } catch (err) {
                console.error("소셜 로그인 처리 실패:", err);
                navigate("/login");
            }
        };

        handleSocialLogin();
    }, [dispatch, navigate]);

    return <p>로그인 처리 중입니다...</p>;
}

export default CookiePage;
