import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { useLogoutMutation, markAllAsRead, clearHistory } from "../../store";
import { Bell, BellRing, Info, CheckCircle, XCircle } from "lucide-react";

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const userInfo = useSelector((state: RootState) => state.user.user);
    const notificationHistory = useSelector((state: RootState) => state.notice.history);
    const unreadCount = notificationHistory.filter((n) => !n.read).length;
    const [logout] = useLogoutMutation();

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ESC 키로 드롭다운 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setNotificationOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

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

    // 알림 클릭 시 열고 모두 읽음 처리
    const handleNotificationClick = () => {
        setNotificationOpen(!notificationOpen);
        if (!notificationOpen && unreadCount > 0) {
            dispatch(markAllAsRead());
        }
    };

    // 시간 포맷
    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "방금 전";
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    };

    const notificationIcons = {
        info: <Info size={18} color="#2196f3" />,
        success: <CheckCircle size={18} color="#4caf50" />,
        error: <XCircle size={18} color="#f44336" />,
    };

    return (
        <nav className="navbar" role="navigation" aria-label="메인 네비게이션">
            <div className="navbar-left">
                <a href="/" className="navbar-logo">
                    My App
                </a>
            </div>

            <div className="navbar-right">
                {/* 알림 버튼 */}
                <div className="notification-wrapper" ref={notificationRef}>
                    <button
                        type="button"
                        className="navbar-bell"
                        aria-label={`알림 ${unreadCount}개`}
                        onClick={handleNotificationClick}
                    >
                        {unreadCount > 0 ? (
                            <BellRing size={24} strokeWidth={2} />
                        ) : (
                            <Bell size={24} strokeWidth={2} />
                        )}
                        {unreadCount > 0 && (
                            <span className="bell-badge" aria-hidden="true">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* 알림 드롭다운 */}
                    {notificationOpen && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <span className="notification-title">알림</span>
                                {notificationHistory.length > 0 && (
                                    <button
                                        className="notification-clear"
                                        onClick={() => dispatch(clearHistory())}
                                    >
                                        모두 삭제
                                    </button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notificationHistory.length === 0 ? (
                                    <div className="notification-empty">
                                        알림이 없습니다
                                    </div>
                                ) : (
                                    notificationHistory.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`notification-item ${!notification.read ? "unread" : ""}`}
                                        >
                                            <span className="notification-icon">
                                                {notificationIcons[notification.type]}
                                            </span>
                                            <div className="notification-content">
                                                <span className="notification-message">
                                                    {notification.message}
                                                </span>
                                                <span className="notification-time">
                                                    {formatTime(notification.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 프로필 메뉴 */}
                <div ref={menuRef}>
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
                            alt="사용자 프로필"
                            className="navbar-profile"
                        />
                    </button>

                    {menuOpen && (
                        <div className="profile-menu" role="menu" aria-label="프로필 메뉴">
                            <div className="profile-header">
                                <img src="/profile.jpg" alt="사용자 프로필" className="profile-avatar" />
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
            </div>
        </nav>
    );
};

export default Navbar;
