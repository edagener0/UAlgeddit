import { Navigate } from "react-router-dom"
import "./Register.css"

export default function Register({token}: {token: string | null})
{
    if (token)
    {
        return <Navigate to="/posts"/>
    }   
    return <div>Register Route</div>
}