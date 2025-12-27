import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { useLogoutMutation } from "../../store";
import { MdNotificationsNone } from "react-icons/md";

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const userInfo = useSelector((state: RootState) => state.user.user);
    const [logout] = useLogoutMutation();

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

    // ESC 키로 드롭다운 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && menuOpen) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [menuOpen]);

    // 로그아웃 처리
    const handleLogout = async () => {
        try {
            await logout().unwrap();
            navigate("/login", { replace: true });
        } catch (err) {
            console.error("로그아웃 중 오류 발생:", err);
            navigate("/login", { replace: true });
        }
    };

    // 공지 존재 여부 (지금은 항상 true로 빨간점 표시)
    const hasNotice = true;

    return (
        <nav className="navbar" role="navigation" aria-label="메인 네비게이션">
            <div className="navbar-left">
                <a href="/" className="navbar-logo">
                    My App
                </a>
            </div>

            <div className="navbar-right" ref={menuRef}>
                <button
                    type="button"
                    className="navbar-bell"
                    aria-label="알림"
                    onClick={() => {
                        console.log("알림 클릭");
                    }}
                >
                    <MdNotificationsNone size={32} />
                    {hasNotice && <span className="bell-badge" aria-hidden="true" />}
                </button>

                <button
                    type="button"
                    className="navbar-profile-btn"
                    aria-label="프로필 메뉴"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <img
                        src="/profile.jpg"
                        alt=""
                        className="navbar-profile"
                    />
                </button>

                {menuOpen && (
                    <div className="profile-menu" role="menu" aria-label="프로필 메뉴">
                        <div className="profile-header">
                            <img src="/profile.jpg" alt="" className="profile-avatar" />
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

                        <div className="profile-divider" role="separator"></div>
                        <button
                            type="button"
                            className="profile-item"
                            role="menuitem"
                            disabled
                            style={{ color: "lightgray" }}
                        >
                            OPEN API 발급
                        </button>
                        <button
                            type="button"
                            className="profile-item"
                            role="menuitem"
                            onClick={() => navigate("/api/history")}
                        >
                            API 성공/오류 내역
                        </button>

                        {userInfo ? (
                            <button
                                type="button"
                                className="profile-item"
                                role="menuitem"
                                onClick={handleLogout}
                            >
                                로그아웃
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="profile-item"
                                role="menuitem"
                                onClick={() => navigate("/login")}
                            >
                                로그인/회원가입
                            </button>
                        )}

                        <div className="profile-divider" role="separator"></div>
                        <button
                            type="button"
                            className="profile-item"
                            role="menuitem"
                            disabled
                            style={{ color: "lightgray" }}
                        >
                            설정
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
