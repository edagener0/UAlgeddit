import { Navigate, useNavigate } from "react-router-dom"
import "./Register.css"
import Form from "../../../components/Form/Form"
import { REGISTER_URL } from "../../../utils/Constants"
import Input from "../../../components/Input/Input"
import { useState } from "react"
import Success from "../../../components/Messages/Success/Success"
import Error from "../../../components/Messages/Error/Error"
import Button from "../../../components/DefaultButton/DefaultButton"

export default function Register({token}: {token: string | null})
{
    if (token)
    {
        return <Navigate to="/posts"/>
    }

    const navigate = useNavigate();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const response = await fetch(REGISTER_URL, 
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username: username, password: password, password_confirm: passwordConfirm}),
            }
        )

        const data  = await response.json();

        if (response.ok)
        {
            setSuccess(data.message);
            setError(null);
        }
        else
        {
            setError(data.message);
            setSuccess(null);
        }
    }

    return (
        <div id="register-container">
            <h1>Register</h1>
            <Success success={success}/>
            <Error error={error}/>
            <Form id="register-form" action={REGISTER_URL} method="POST" onSubmit={handleRegister}>
                <Input name="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                <Input name="password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                <Input name="password_confirm" placeholder="Confirm Password" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}/>
                <Button label="Register" type="submit"/>
            </Form>
        </div>
    )
}