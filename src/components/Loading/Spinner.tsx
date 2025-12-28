// src/components/Loading/Spinner.tsx
import React from "react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className = "" }) => {
    return <div className={`spinner spinner--${size} ${className}`} />;
};

// 전체 화면 로딩
export const FullPageSpinner: React.FC = () => {
    return (
        <div className="spinner-overlay">
            <Spinner size="lg" />
        </div>
    );
};

// 인라인 로딩 (버튼 등에 사용)
export const InlineSpinner: React.FC = () => {
    return <Spinner size="sm" className="inline-spinner" />;
};

export default Spinner;
