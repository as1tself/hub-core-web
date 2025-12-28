// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../hooks";
import { useLazyGetUserQuery } from "../store/apis/userApi";
import { Spinner } from "./Loading";

interface ProtectedRouteProps {
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectTo = "/login" }) => {
    const user = useAppSelector((state) => state.user.user);
    const [getUser] = useLazyGetUserQuery();

    const [isChecking, setIsChecking] = useState(!user);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        // user가 이미 있으면 체크 불필요
        if (user) return;

        const checkAuth = async () => {
            try {
                // getUser 호출 → 401 시 baseQueryWithReauth가 자동으로 refresh 시도
                await getUser().unwrap();
                setIsChecking(false);
            } catch {
                // refresh도 실패한 경우
                setShouldRedirect(true);
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [user, getUser]);

    // user가 이미 있으면 바로 렌더링
    if (user) {
        return <Outlet />;
    }

    if (isChecking) {
        return <Spinner />;
    }

    if (shouldRedirect) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
