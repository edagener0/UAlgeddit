import "./PostCreate.css";

import { useState } from "react";
import { POST_CREATE } from "../../../utils/Constants";
import Input from "../../../components/Input/Input";
import Button from "../../../components/DefaultButton/DefaultButton";
import Form from "../../../components/Form/Form";
import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";
import { useParams } from "react-router-dom";
import TextField from "../../../components/TextField/TextField";

export default function PostsCreate({token, currentUserID}: {token: string | null; currentUserID: number | null;}) 
{
  const { subgedditID } = useParams();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await fetch(POST_CREATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        content,
        user_id: currentUserID,
        subgeddit_id: subgedditID,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setSuccess(data.message);
      setError(null);
    } else {
      setError(data.message);
      setSuccess(null);
    }
  };

  return (
    <div id="create-post-container">
      <h1>Create a Post!</h1>
      <Success success={success} />
      <Error error={error} />
      <Form
        id="post-form"
        action={POST_CREATE}
        method="POST"
        onSubmit={handleCreation}
      >
        <Input
          name="title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          name="content"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button label="Create" type="submit" />
      </Form>
    </div>
  );
}
