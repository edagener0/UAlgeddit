import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LOGOUT_URL } from "../../utils/Constants";

export default function Logout({logout}: {logout: () => void})
{
    useEffect(() => {
        const logoutAsync = async () => {
            await fetch(LOGOUT_URL,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"}
                }
            )

            logout()
        }
        
        logoutAsync()
        
    }, [])

    return <Navigate to="/login"/>;
}