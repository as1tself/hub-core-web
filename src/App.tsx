import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import UserPage from "./pages/UserPage.tsx";
import DashboardPage from "./pages/Dashboard.tsx";
import JoinPage from "./pages/JoinPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import CookiePage from "./pages/CookiePage.tsx";

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/user" element={<UserPage />} />

                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/cookie" element={<CookiePage />} />
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;
