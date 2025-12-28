import React, { useState } from "react";
import { FileText, Megaphone } from "lucide-react";
import MenuTree from "../SidebarMenu/MenuTree";

const Sidebar: React.FC = () => {
    const [isOpen] = useState(true);

    return (
        <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
            <div className="sidebar-content">
                <MenuTree />
            </div>
            <div className="sidebar-footer">
                <div className="sidebar-footer-divider"></div>
                <a className="menu-button footer-link" href="#changelog">
                    <FileText className="menu-icon" size={16} strokeWidth={2} />
                    변경내역
                </a>
                <a className="menu-button footer-link" href="#notice">
                    <Megaphone className="menu-icon" size={16} strokeWidth={2} />
                    공지사항
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
