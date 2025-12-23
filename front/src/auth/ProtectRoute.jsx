// front/src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, isTokenExpired, clearTokens } from "./token";

export default function ProtectedRoute() {
    const location = useLocation();
    const token = getAccessToken();

    // 토큰이 없거나 만료면 로그인으로 이동
    if (!token || isTokenExpired(token)) {
        clearTokens();
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
