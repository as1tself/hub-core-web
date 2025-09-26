import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store/store";
import { clearUser } from "../../store/userSlice";
import { userApi } from "../../store/userApi";
import { MdNotificationsNone } from "react-icons/md"; // ✅ 알림 아이콘

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
            dispatch(userApi.util.resetApiState()); // RTK Query 캐시 초기화

            window.location.replace("/login");
        } catch (err) {
            console.error("로그아웃 중 오류 발생:", err);
        }
    };

    // 공지 존재 여부 (지금은 항상 true로 빨간점 표시)
    const hasNotice = true;

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <a href="/" className="navbar-logo">
                    My App
                </a>
            </div>

            <div className="navbar-right" ref={menuRef}>
                {/* ✅ 프로필 왼쪽에 알림 벨 추가 */}
                <button
                    type="button"
                    className="navbar-bell"
                    aria-label="알림"
                    onClick={() => {
                        // TODO: 알림 패널 열기 로직 (필요 시)
                        console.log("알림 클릭");
                    }}
                >
                    <MdNotificationsNone size={32} />
                    {hasNotice && <span className="bell-badge" />}
                </button>

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
                                <div className="profile-email">{userInfo?.email ?? ""}</div>
                                <a href="/user" className="profile-link">
                                    내 정보 보기
                                </a>
                            </div>
                        </div>

                        <div className="profile-divider"></div>
                        <div className="profile-item" style={{color:"lightgray"}}>OPEN API 발급</div>
                        <div className="profile-item" onClick={() => (window.location.href = "/api/history")}>
                            API 성공/오류 내역
                        </div>

                        {userInfo ? (
                            <div className="profile-item" onClick={handleLogout}>
                                로그아웃
                            </div>
                        ) : (
                            <div
                                className="profile-item"
                                onClick={() => (window.location.href = "/login")}
                            >
                                로그인/회원가입
                            </div>
                        )}

                        <div className="profile-divider"></div>
                        <div className="profile-item" style={{color:"lightgray"}}>설정</div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
