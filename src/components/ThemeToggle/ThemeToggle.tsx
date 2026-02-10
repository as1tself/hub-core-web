import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks";
import "./ThemeToggle.css";

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
        >
            <div className="theme-toggle__track">
                <Sun className="theme-toggle__icon theme-toggle__icon--sun" size={14} />
                <Moon className="theme-toggle__icon theme-toggle__icon--moon" size={14} />
                <div className={`theme-toggle__thumb ${isDark ? "dark" : "light"}`} />
            </div>
        </button>
    );
};

export default ThemeToggle;
