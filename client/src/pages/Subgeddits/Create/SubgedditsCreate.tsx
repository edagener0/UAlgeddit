import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";
import { SUBGEDDIT_CREATE } from "../../../utils/Constants";
import { useState } from "react";
import Form from "../../../components/Form/Form";
import Input from "../../../components/Input/Input";
import Button from "../../../components/DefaultButton/DefaultButton";
export default function SubgedditsCreate({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
    const [name, setName] = useState("");
        const [error, setError] = useState(null);
        const [success, setSuccess] = useState(null);
    
        const handleCreation = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                const response = await fetch(SUBGEDDIT_CREATE, 
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({name, currentUserID}),
                        
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
            <div id="create-subgeddit-container">
                <h1>Create a Subgeddit!</h1>
                <Success success={success}/>
                <Error error={error}/>
                <Form id="subgeddit-form" action={SUBGEDDIT_CREATE} method="POST" onSubmit={handleCreation}>
                    <Input name="username" placeholder="Username" value={name} onChange={(e) => setName(e.target.value)}/>
                    <Button label="Create" type="submit"/>
                </Form>
            </div>
        )
}