// src/hooks/useAuth.ts
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { clearUser, clearAccessToken, userApi, useLogoutMutation } from "../store";
import { dpopClient } from "../lib/dpop";

export const useAuth = () => {
    const user = useAppSelector((state) => state.user.user);
    const dispatch = useAppDispatch();
    const [logoutMutation] = useLogoutMutation();

    const logout = async () => {
        try {
            await logoutMutation().unwrap();
        } catch {
            // 서버 로그아웃 실패 시에도 로컬 정리 진행
        } finally {
            dispatch(clearAccessToken());
            dispatch(clearUser());
            dispatch(userApi.util.resetApiState());
            await dpopClient.clearKeyPair();
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        logout,
    };
};
