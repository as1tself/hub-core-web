// src/components/LocaleToggle/LocaleToggle.tsx
import { useLocale } from "../../hooks/useLocale";
import "./LocaleToggle.css";

const LocaleToggle = () => {
    const { isKorean, toggleLocale } = useLocale();

    return (
        <button
            type="button"
            className="locale-toggle"
            onClick={toggleLocale}
            aria-label={isKorean ? "Switch to English" : "한국어로 전환"}
        >
            <div className="locale-toggle__track">
                <span className={`locale-toggle__label locale-toggle__label--ko ${isKorean ? "active" : ""}`}>
                    한
                </span>
                <span className={`locale-toggle__label locale-toggle__label--en ${!isKorean ? "active" : ""}`}>
                    EN
                </span>
                <div className={`locale-toggle__thumb ${isKorean ? "ko" : "en"}`} />
            </div>
        </button>
    );
};

export default LocaleToggle;
