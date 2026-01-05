// src/hooks/useAuthNavigate.ts
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "./";
import { useLazyGetUserQuery, showToast } from "../store";

/**
 * 인증이 필요한 페이지로 이동하는 커스텀 훅
 * - 로그인 상태면 바로 이동
 * - 비로그인 상태면 토큰 refresh 시도 후 이동 또는 로그인 페이지로 리다이렉트
 */
export const useAuthNavigate = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user.user);
    const [getUser] = useLazyGetUserQuery();
    const [isChecking, setIsChecking] = useState(false);

    const navigateWithAuth = useCallback(
        async (path: string, options?: { onSuccess?: () => void }) => {
            // 이미 로그인되어 있으면 바로 이동
            if (user) {
                navigate(path);
                options?.onSuccess?.();
                return;
            }

            // 인증 체크 중
            setIsChecking(true);
            dispatch(showToast({ message: "로그인 확인 중...", type: "info" }));

            try {
                // getUser 호출 → 401 시 baseQueryWithReauth가 자동으로 refresh 시도
                await getUser().unwrap();
                navigate(path);
                options?.onSuccess?.();
            } catch {
                // refresh도 실패하면 로그인 페이지로
                dispatch(showToast({ message: "로그인이 필요합니다", type: "error" }));
                navigate("/login");
            } finally {
                setIsChecking(false);
            }
        },
        [user, navigate, dispatch, getUser]
    );

    return {
        navigateWithAuth,
        isChecking,
    };
};
