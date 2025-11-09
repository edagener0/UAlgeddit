import { jwtDecode } from "jwt-decode";
import {
    Outlet,
    Navigate
} from "react-router-dom"

const PrivateRoutes = ({token}: {token: string | null}) => {
    if (!token)
    {
        return <Navigate to="/login"/>
    }

    try 
    {
        const {exp} = jwtDecode(token);
        if (!exp || Date.now() >= exp * 1000)
        {
            return <Navigate to="/login"/>
        }
    } 
    catch (error) 
    {
        return <Navigate to="/login"/>
    }
    return <Outlet/>
}

export default PrivateRoutes