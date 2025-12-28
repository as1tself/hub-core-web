import React from "react";
import { Home, User, BarChart3, type LucideIcon } from "lucide-react";
import MenuItem from "./MenuItem";

export interface MenuItemData {
    label: string;
    path?: string;
    icon?: LucideIcon;
    children?: MenuItemData[];
    requiresAuth?: boolean;
}

const menuData: MenuItemData[] = [
    { label: "홈", path: "/", icon: Home },
    { label: "내 정보", path: "/user", icon: User, requiresAuth: true },
    { label: "API 내역", path: "/api/history", icon: BarChart3, requiresAuth: true },
];

const MenuTree: React.FC = () => {
    return (
        <div className="menu-tree">
            {menuData.map((item, index) => (
                <MenuItem key={index} item={item} />
            ))}
        </div>
    );
};

export default MenuTree;
