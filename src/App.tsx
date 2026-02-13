import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { ProtectedRoute } from "./components";
import { FullPageSpinner } from "./components/Loading";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const CookiePage = lazy(() => import("./pages/CookiePage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const ApiHistoryPage = lazy(() => import("./pages/ApiHistoryPage"));

const App: React.FC = () => {
    return (
        <Router>
            <Layout>
                <Suspense fallback={<FullPageSpinner />}>
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
                </Suspense>
            </Layout>
        </Router>
    );
};

export default App;
