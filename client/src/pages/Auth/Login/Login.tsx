import { useState, type ChangeEvent } from "react"
import Button from "../../../components/DefaultButton/DefaultButton"
import Form from "../../../components/Form/Form"
import Input from "../../../components/Input/Input"
import "./Login.css"
import { LOGIN_URL } from "../../../utils/Constants"
import { Navigate, useNavigate } from "react-router-dom"
import Error from "../../../components/Messages/Error/Error"

export default function Login({login, token}: {login: ((newToken: string) => void), token: string | null})
{
    if (token)
    {
        return <Navigate to="/posts"/>
    }


    const navigate = useNavigate();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const response = await fetch(LOGIN_URL,
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            }
        )

        const data = await response.json()

        if (response.ok)
        {
            login(data.token);
            navigate("/posts");
        }
        else
        {
            setError(data.message);
        }
    }

    return (
        <div id="login-container">
            <h1>Login</h1>
            <Error error={error}/>
            <Form id="login-form" action={LOGIN_URL} method="POST" onSubmit={handleLogin}>
                <Input placeholder="Username" type="text" name="username" value={username} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}/>

                <Input placeholder="Password" type="password" name="password" value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}/>

                <Button label="Login" type="submit"/>
            </Form>
        </div>
        
    )
}