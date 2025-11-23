import { jwtDecode } from "jwt-decode";

export interface JWTDecoded {
    userID: number
    username: string
    iat: number
    exp: number
}

export function getUserFromToken(token: string | null): JWTDecoded | null {
    if (!token) return null;
    try {
        const decoded: JWTDecoded = jwtDecode(token);
        return decoded
    } catch {
        return null;
    }
}
