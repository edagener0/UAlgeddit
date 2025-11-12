import { jwtDecode } from "jwt-decode";
import {
    Outlet,
    Navigate
} from "react-router-dom"

const PrivateRoutes = ({token, setToken}: {token: string | null, setToken: React.Dispatch<React.SetStateAction<string | null>>}) => {
    if (!token)
    {
        return <Navigate to="/login"/>
    }

    try 
    {
        const {exp} = jwtDecode(token);
        if (!exp || Date.now() >= exp * 1000)
        {
            setToken(null);
            return <Navigate to="/login"/>
        }
    } 
    catch (error) 
    {
        setToken(null);
        return <Navigate to="/login"/>
    }
    return <Outlet/>
}

export default PrivateRoutes