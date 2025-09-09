import { useEffect, useState } from "react";
import { fetchWithAccess } from "../util/fetchUtil";

// .env로 부터 백엔드 URL 받아오기
const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

type User = {
    username: string;
    nickname: string;
    email: string;
};

function UserPage() {
    // 정보
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [error, setError] = useState<string>("");

    // 페이지 방문시 유저 정보 요청
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await fetchWithAccess(`${BACKEND_API_BASE_URL}/user`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error("유저 정보 불러오기 실패");

                const data: User = await res.json();
                setUserInfo(data);
            } catch (err) {
                console.error(err);
                setError("유저 정보를 불러오지 못했습니다.");
            }
        };

        fetchUserInfo();
    }, []);

    if (error) return <p>{error}</p>;
    if (!userInfo) return <p>불러오는 중...</p>;

    return (
        <div>
            <h1>내 정보</h1>
            <p>아이디: {userInfo.username}</p>
            <p>닉네임: {userInfo.nickname}</p>
            <p>이메일: {userInfo.email}</p>
        </div>
    );
}

export default UserPage;
