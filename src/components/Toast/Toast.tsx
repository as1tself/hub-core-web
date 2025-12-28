import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { hideToast } from "../../store";
import { X, Info, CheckCircle, XCircle } from "lucide-react";
import "./Toast.css";

const MAX_VISIBLE_TOASTS = 4;
const ANIMATION_DURATION = 300;

interface ToastData {
    id: string;
    message: string;
    type: "info" | "success" | "error";
}

interface ToastItemProps {
    toast: ToastData;
    index: number;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, index, onRemove }) => {
    const [animationState, setAnimationState] = useState<"entering" | "visible" | "exiting">("entering");

    useEffect(() => {
        // 진입 애니메이션 완료 후 visible 상태로
        const enterTimer = setTimeout(() => {
            setAnimationState("visible");
        }, ANIMATION_DURATION);

        // 3초 후 자동 삭제
        const autoCloseTimer = setTimeout(() => {
            handleClose();
        }, 3000);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(autoCloseTimer);
        };
    }, []);

    const handleClose = () => {
        if (animationState === "exiting") return;
        setAnimationState("exiting");
        setTimeout(() => {
            onRemove(toast.id);
        }, ANIMATION_DURATION);
    };

    const icons = {
        info: <Info size={20} strokeWidth={2} />,
        success: <CheckCircle size={20} strokeWidth={2} />,
        error: <XCircle size={20} strokeWidth={2} />,
    };

    // 오래된 토스트(아래쪽)가 투명해짐
    let baseOpacity = 1;
    if (index >= MAX_VISIBLE_TOASTS) {
        const overflowIndex = index - MAX_VISIBLE_TOASTS;
        baseOpacity = Math.max(0, 1 - (overflowIndex + 1) * 0.4);
    }

    // 애니메이션 상태에 따른 클래스
    const animationClass = animationState === "entering"
        ? "toast-enter"
        : animationState === "exiting"
            ? "toast-exit"
            : "";

    return (
        <div
            className={`toast toast-${toast.type} ${animationClass}`}
            role="alert"
            style={{
                "--base-opacity": baseOpacity,
                pointerEvents: baseOpacity < 0.3 || animationState === "exiting" ? "none" : "auto",
            } as React.CSSProperties}
        >
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="닫기"
            >
                <X size={18} strokeWidth={2} />
            </button>
        </div>
    );
};

const Toast: React.FC = () => {
    const dispatch = useAppDispatch();
    const toasts = useAppSelector((state) => state.notice.toasts);

    const handleRemove = (id: string) => {
        dispatch(hideToast(id));
    };

    if (toasts.length === 0) return null;

    // 역순으로 렌더링 (최신이 위에)
    const reversedToasts = [...toasts].reverse();

    return (
        <div className="toast-container">
            {reversedToasts.map((toast, index) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    index={index}
                    onRemove={handleRemove}
                />
            ))}
        </div>
    );
};

export default Toast;
