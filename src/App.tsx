import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { ProtectedRoute } from "./components";
import UserPage from "./pages/UserPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import JoinPage from "./pages/JoinPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import CookiePage from "./pages/CookiePage.tsx";
import ApiHistoryPage from "./pages/ApiHistoryPage.tsx";

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/join" element={<JoinPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/cookie" element={<CookiePage />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/user" element={<UserPage />} />
                        <Route path="/api/history" element={<ApiHistoryPage />} />
                    </Route>

                    <Route path="*" element={<h1>404 Not Found</h1>} />
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;
