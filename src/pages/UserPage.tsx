// src/pages/UserPage.tsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetUserQuery } from "../store";
import { Skeleton, Spinner } from "../components/Loading";

function UserPage() {
    useEffect(() => {
        document.title = '내 정보 - My App';
    }, []);

    const { isLoading, error } = useGetUserQuery();
    const storedUser = useSelector((s: RootState) => s.user.user);

    if (isLoading) {
        return (
            <div className="user-page">
                <h1>내 정보</h1>
                <div className="user-info-skeleton">
                    <div className="info-row">
                        <Skeleton width={60} height={16} />
                        <Skeleton width={120} height={16} />
                    </div>
                    <div className="info-row">
                        <Skeleton width={60} height={16} />
                        <Skeleton width={100} height={16} />
                    </div>
                    <div className="info-row">
                        <Skeleton width={60} height={16} />
                        <Skeleton width={180} height={16} />
                    </div>
                    <div className="info-row">
                        <Skeleton width={80} height={16} />
                        <Skeleton width={40} height={16} />
                    </div>
                </div>
                <div className="loading-container">
                    <Spinner size="md" />
                    <p>사용자 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) return <p>유저 정보를 불러오지 못했습니다.</p>;
    if (!storedUser) return <p>데이터 없음</p>;

    return (
        <div className="user-page">
            <h1>내 정보</h1>
            <div className="user-info">
                <p><span className="label">아이디:</span> {storedUser.username}</p>
                <p><span className="label">닉네임:</span> {storedUser.nickname}</p>
                <p><span className="label">이메일:</span> {storedUser.email}</p>
                <p><span className="label">소셜 로그인:</span> {storedUser.social ? "예" : "아니오"}</p>
            </div>
        </div>
    );
}

export default UserPage;
