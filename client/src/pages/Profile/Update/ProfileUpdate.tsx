import "./ProfileUpdate.css"
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import type ProfileI from "../View/ProfileI";
import { PROFILE_UPDATE, PROFILE_VIEW } from "../../../utils/Constants";
import Form from "../../../components/Form/Form";
import TextField from "../../../components/TextField/TextField";
import Input from "../../../components/Input/Input";
import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";
import Button from "../../../components/DefaultButton/DefaultButton";

export default function ProfileUpdate({ token }: { token: string | null }) 
{
    const { user_id } = useParams();

    const [user, setUser] = useState<ProfileI | null>(null);
    const [biography, setBiography] = useState("");
    const [birthday, setBirthday] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const fetchUser = async () => {
        const response = await fetch(`${PROFILE_VIEW}/${user_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        });

        const data = await response.json();
        setUser(data);
        setBiography(data.biography ?? "")
        setBirthday(data.birthday ?? "")
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch(`${PROFILE_UPDATE}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ biography, birthday }),
        });
        const data = await response.json()
        if (response.status === 200)
        {
            setSuccess(data.message);
            setError("");
        }
        else
        {
            setError(data.message);
            setSuccess("");
        }
    };
    useEffect(() => 
    {
        fetchUser();
    }, []);

    if (!user) 
    {
        return <p>User not found!</p>;
    }

  return (
    <div id="update-container">
        <Success success={success}/>
        <Error error={error}/>
      <Form onSubmit={handleSubmit} id="form">
        <div className="form-item">
          <label htmlFor="birthday">Birthday</label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        <div className="form-item">
          <label htmlFor="biography">Biography</label>
          <TextField
            name="biography"
            placeholder="Biography"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
          />
        </div>

        <Button type="submit" label="Save"/>
      </Form>
    </div>
  );
}
