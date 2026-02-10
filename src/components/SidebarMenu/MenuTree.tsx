import React from "react";
import { Home, User, BarChart3, type LucideIcon } from "lucide-react";
import MenuItem from "./MenuItem";
import { useLocale } from "../../hooks";

export interface MenuItemData {
    label: string;
    path?: string;
    icon?: LucideIcon;
    children?: MenuItemData[];
    requiresAuth?: boolean;
}

const MenuTree: React.FC = () => {
    const { t } = useLocale();

    const menuData: MenuItemData[] = [
        { label: t.nav.home, path: "/", icon: Home },
        { label: t.nav.myInfo, path: "/user", icon: User, requiresAuth: true },
        { label: t.nav.apiHistory, path: "/api/history", icon: BarChart3, requiresAuth: true },
    ];

    return (
        <div className="menu-tree">
            {menuData.map((item, index) => (
                <MenuItem key={index} item={item} />
            ))}
        </div>
    );
};

export default MenuTree;
