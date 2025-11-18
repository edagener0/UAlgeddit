import { jwtDecode } from "jwt-decode";
import {
    Outlet,
    Navigate
} from "react-router-dom"

const PrivateRoutes = ({token, logout}: {token: string | null, logout: () => void}) => {
    if (!token)
    {
        return <Navigate to="/login"/>
    }

    try 
    {
        const {exp} = jwtDecode(token);
        if (!exp || Date.now() >= exp * 1000)
        {
            logout();
            return <Navigate to="/login"/>
        }
    } 
    catch (error) 
    {
        logout();
        return <Navigate to="/login"/>
    }
    return <Outlet/>
}

export default PrivateRoutes