// src/hooks/useAuth.ts
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { clearUser, clearAccessToken, userApi } from "../store";

export const useAuth = () => {
    const user = useAppSelector((state) => state.user.user);
    const dispatch = useAppDispatch();

    const logout = async () => {
        dispatch(clearAccessToken());
        dispatch(clearUser());
        dispatch(userApi.util.resetApiState());
    };

    return {
        user,
        isAuthenticated: !!user,
        logout,
    };
};
