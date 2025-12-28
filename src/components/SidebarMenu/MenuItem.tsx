import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLazyGetUserQuery } from "../../store/apis/userApi";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { showToast } from "../../store";
import type { MenuItemData } from "./MenuTree";

interface MenuItemProps {
    item: MenuItemData;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user.user);
    const [getUser] = useLazyGetUserQuery();
    const [isChecking, setIsChecking] = useState(false);

    // 현재 경로와 메뉴 경로가 일치하면 활성화
    const isActive = item.path && location.pathname === item.path;

    const handleAuthClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        // 이미 로그인되어 있으면 바로 이동
        if (user) {
            navigate(item.path || "/");
            return;
        }

        // 인증 체크 중
        setIsChecking(true);
        dispatch(showToast({ message: "로그인 확인 중...", type: "info" }));

        try {
            // getUser 호출 → 401 시 baseQueryWithReauth가 자동으로 refresh 시도
            await getUser().unwrap();
            navigate(item.path || "/");
        } catch {
            // refresh도 실패하면 로그인 페이지로
            dispatch(showToast({ message: "로그인이 필요합니다", type: "error" }));
            navigate("/login");
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className={`menu-item ${isActive ? "active" : ""}`}>
            {item.children && item.children.length > 0 ? (
                <>
                    <button className="menu-button" onClick={() => setOpen(!open)}>
                        {item.icon && <item.icon className="menu-icon" size={18} strokeWidth={2} />}
                        <span className="arrow">{open ? "▼" : "▶"}</span>
                        {item.label}
                    </button>
                    {open && (
                        <div className="menu-children">
                            {item.children.map((child, index) => (
                                <MenuItem key={index} item={child} />
                            ))}
                        </div>
                    )}
                </>
            ) : item.requiresAuth ? (
                <button
                    onClick={handleAuthClick}
                    className={`menu-button ${isActive ? "active" : ""}`}
                    disabled={isChecking}
                    style={{ opacity: isChecking ? 0.7 : 1 }}
                >
                    {item.icon && <item.icon className="menu-icon" size={18} strokeWidth={2} />}
                    {item.label}
                </button>
            ) : (
                <Link
                    to={item.path || "#"}
                    className={`menu-button ${isActive ? "active" : ""}`}
                >
                    {item.icon && <item.icon className="menu-icon" size={18} strokeWidth={2} />}
                    {item.label}
                </Link>
            )}
        </div>
    );
};

export default MenuItem;
