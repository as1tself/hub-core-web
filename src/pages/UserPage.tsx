// src/pages/UserPage.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { useGetUserQuery } from "../store/userApi";

function UserPage() {
    const { isLoading, error } = useGetUserQuery(); // 호출만 해주면 onQueryStarted가 알아서 set/clear
    const storedUser = useSelector((s: RootState) => s.user.user);

    if (isLoading) return <p>불러오는 중...</p>;
    if (error) return <p>유저 정보를 불러오지 못했습니다.</p>;
    if (!storedUser) return <p>데이터 없음</p>;

    return (
        <div>
            <h1>내 정보</h1>
            <p>아이디: {storedUser.username}</p>
            <p>닉네임: {storedUser.nickname}</p>
            <p>이메일: {storedUser.email}</p>
            <p>소셜 로그인: {storedUser.social ? "예" : "아니오"}</p>
        </div>
    );
}

export default UserPage;
