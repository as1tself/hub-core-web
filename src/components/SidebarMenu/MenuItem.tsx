import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface MenuItemProps {
    item: { label: string; path?: string; children?: MenuItemProps["item"][] };
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    // 현재 경로와 메뉴 경로가 일치하면 활성화
    const isActive = item.path && location.pathname === item.path;

    return (
        <div className={`menu-item ${isActive ? "active" : ""}`}>
            {item.children && item.children.length > 0 ? (
                <>
                    <button className="menu-button" onClick={() => setOpen(!open)}>
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
            ) : (
                <Link
                    to={item.path || "#"}
                    className={`menu-button ${isActive ? "active" : ""}`}
                >
                    {item.label}
                </Link>
            )}
        </div>
    );
};

export default MenuItem;
