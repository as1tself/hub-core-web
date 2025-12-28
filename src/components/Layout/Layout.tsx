import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <Navbar />
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    );
};

export default Layout;
