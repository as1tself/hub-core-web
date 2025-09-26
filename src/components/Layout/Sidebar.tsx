import React, { useState } from "react";
import MenuTree from "../SidebarMenu/MenuTree";

const Sidebar: React.FC = () => {
    const [isOpen] = useState(true);

    return (
        <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
            <div className="sidebar-content">
                <MenuTree />
            </div>
            <div className="sidebar-footer">
                <div>
                    <div className="divider"></div>
                    <div className="divider"></div>
                </div>
                <div>
                    <a className="menu-button">
                        변경내역
                    </a>
                </div>
                <div>
                    <a className="menu-button">
                        공지사항
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
