import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Toast } from "../Toast";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <Navbar />
            <Sidebar />
            <Toast />
            <main className="main-content">{children}</main>
        </div>
    );
};

export default Layout;
