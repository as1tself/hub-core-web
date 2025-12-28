import React from "react";
import MenuItem from "./MenuItem";

const menuData = [
    { label: "홈", path: "/" },
    { label: "DESC", path: "/user" },
    // {
    //     label: "Settings",
    //     children: [
    //         { label: "Profile", path: "user" },
    //         { label: "Account", path: "/settings/account" },
    //     ],
    // },
    // {
    //     label: "Reports",
    //     children: [
    //         { label: "Daily", path: "/reports/daily" },
    //         { label: "Monthly", path: "/reports/monthly" },
    //     ],
    // },
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
