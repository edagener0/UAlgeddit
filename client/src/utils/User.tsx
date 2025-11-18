import { jwtDecode } from "jwt-decode";

export interface JWTDecoded {
    userID: number
    iat: number
    exp: number
}

export function getUserFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
        const decoded: JWTDecoded = jwtDecode(token);
        return decoded.userID;
    } catch {
        return null;
    }
}
