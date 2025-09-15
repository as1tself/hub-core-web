import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store/store";
import { clearUser } from "../../store/userSlice";
import { userApi } from "../../store/userApi";

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.user.user);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 로그아웃 처리
    const handleLogout = async () => {
        try {
            const res = await fetch(`${BACKEND_API_BASE_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) throw new Error("로그아웃 실패");

            localStorage.removeItem("accessToken");
            dispatch(clearUser());
            dispatch(userApi.util.resetApiState()); // RTK Query 캐시 초기화 (혹시 남아있을 경우)

            window.location.replace("/login");
        } catch (err) {
            console.error("로그아웃 중 오류 발생:", err);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <h1 style={{ fontWeight: "bold" }}>My App</h1>
            </div>
            <div className="navbar-right" ref={menuRef}>
                <img
                    src="/profile.jpg"
                    alt="profile"
                    className="navbar-profile"
                    onClick={() => setMenuOpen(!menuOpen)}
                />
                {menuOpen && (
                    <div className="profile-menu">
                        <div className="profile-header">
                            <img src="/profile.jpg" alt="profile" className="profile-avatar" />
                            <div className="profile-info">
                                <div className="profile-name">
                                    {userInfo ? userInfo.username : "로그인 필요"}
                                </div>
                                <div className="profile-email">
                                    {userInfo?.email ?? ""}
                                </div>
                                <a href="/user" className="profile-link">
                                    내 정보 보기
                                </a>
                            </div>
                        </div>

                        <div className="profile-divider"></div>
                        <div className="profile-item">첫번째 메뉴</div>
                        <div className="profile-item">API 내역</div>

                        {userInfo ? (
                            <div className="profile-item" onClick={handleLogout}>
                                로그아웃
                            </div>
                        ) : (
                            <div
                                className="profile-item"
                                onClick={() => (window.location.href = "/login")}
                            >
                                로그인
                            </div>
                        )}

                        <div className="profile-divider"></div>
                        <div className="profile-item">설정</div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
