// front/src/auth/token.js
const ACCESS_KEY = "authToken";
const REFRESH_KEY = "refreshToken";

export function setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

// exp 기반 만료 체크(프론트 1차 판별용)
export function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload?.exp) return false;
        const now = Math.floor(Date.now() / 1000);
        return payload.exp <= now;
    } catch {
        return true;
    }
}

export function isAuthenticated() {
    const token = getAccessToken();
    return token && !isTokenExpired(token);
}
