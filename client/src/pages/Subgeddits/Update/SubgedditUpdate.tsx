import { useState, type FormEvent} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Form from "../../../components/Form/Form";
import Input from "../../../components/Input/Input";
import { SUBGEDDIT_UPDATE } from "../../../utils/Constants";
import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";
import Button from "../../../components/DefaultButton/DefaultButton";
import "./SubgedditUpdate.css"

export default function SubgedditUpdate({ token }: { token: string | null }) 
{
  const { subgeddit_id } = useParams();

  const [name, setName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(subgeddit_id)
    if (!subgeddit_id) return;

    try 
    {
      const response = await fetch(`${SUBGEDDIT_UPDATE}/${subgeddit_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json()

      if (response.status === 200)
      {
        setSuccess(data.message)
        setError("")
      }
      else
      {
        setError(data.message)
        setSuccess("")
      }

    } 
    catch 
    {
      setError("Internal Server Error")
      setSuccess("")
    } 
  };

  return (
    <div id="subgeddit-update-container">
      <h2>Update Subgeddit</h2>
      <Success success={success}/>
      <Error error={error}/>
      <Form onSubmit={handleSubmit} id="subgeddit-update-form">
        <div className="form-item">
          <label htmlFor="name">Name</label>
          <Input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" label="Update"/>
      </Form>
    </div>
  );
}
