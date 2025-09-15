import React, { useState } from "react";
import MenuTree from "../SidebarMenu/MenuTree";

const Sidebar: React.FC = () => {
    const [isOpen] = useState(true);

    return (
        <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
            <div className="sidebar-content">
                <MenuTree />
            </div>
        </aside>
    );
};

export default Sidebar;
