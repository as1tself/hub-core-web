// src/pages/UserPage.tsx
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { useEffect } from "react";
import { useGetUserQuery } from "../store/userApi";
import { setUser } from "../store/userSlice";

function UserPage() {
    const dispatch = useDispatch();
    const storedUser = useSelector((state: RootState) => state.user.user);

    // ✅ username 넘길 필요 없음
    const { data: user, error, isLoading } = useGetUserQuery();

    useEffect(() => {
        if (user) {
            dispatch(setUser(user));
        }
    }, [user, dispatch]);

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
