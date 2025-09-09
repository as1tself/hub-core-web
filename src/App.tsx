import {BrowserRouter, Routes, Route, useNavigate} from "react-router-dom";

import JoinPage from "./pages/JoinPage";
import LoginPage from "./pages/LoginPage";
import CookiePage from "./pages/CookiePage";
import UserPage from "./pages/UserPage";

import './App.css'

function App() {

    function HomeButtons() {
        const navigate = useNavigate();

        const handleLogout = () => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            navigate("/", { replace: true });
        };

        return (
            <div>
                <button onClick={() => navigate("/")}>메인화면</button>
                <button onClick={() => navigate("/login")}>로그인</button>
                <button onClick={() => navigate("/user")}>내정보</button>
                <button onClick={handleLogout}>로그아웃</button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/join" element={<JoinPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cookie" element={<CookiePage />} />
                <Route path="/user" element={<UserPage />} />
            </Routes>
            <div>
                <HomeButtons />
            </div>
        </BrowserRouter>
    );
}

export default App;
