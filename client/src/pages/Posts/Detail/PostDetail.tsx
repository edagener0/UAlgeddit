import { useEffect, useState } from "react"
import "./PostDetail.css"
import { type PostDetailI } from "./PostDetailInterface"
import { POST_DETAIL, POST_DOWNVOTE, POST_UNVOTE, POST_UPVOTE } from "../../../utils/Constants";
import { useParams } from "react-router-dom";
import Button from "../../../components/DefaultButton/DefaultButton";
import Form from "../../../components/Form/Form";
import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";

export default function PostDetail({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
    const {id} = useParams();
    const [post, setPost] = useState<PostDetailI | null>(null);
    const [upvotes, setUpvotes] = useState(0);
    const [downvotes, setDownvotes] = useState(0);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [hasDownvoted, setHasDownvoted] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleUpvote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`${POST_UPVOTE}/${post?.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          
        });
        
        if (hasUpvoted) return;

        const data = await response.json();
        if (response.ok) {
          setSuccess(data.message);
          setError(null);
          
          if (hasDownvoted)
          {
            setDownvotes(downvotes - 1);
          }

          setHasDownvoted(false)
          setHasUpvoted(true)
          setUpvotes(upvotes + 1);
        } 
        else 
        {
          setError(data.message);
          setSuccess(null);
        }
      };

    const handleDownvote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`${POST_DOWNVOTE}/${post?.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          
        });
        
        if (hasDownvoted) return;

        const data = await response.json();
        if (response.ok) {
          setSuccess(data.message);
          setError(null);

          if (hasUpvoted)
          {
            setUpvotes(upvotes - 1);
          }

          setHasDownvoted(true)
          setHasUpvoted(false)
          setDownvotes(downvotes + 1);
        } 
        else 
        {
          setError(data.message);
          setSuccess(null);
        }
      };

    const handleUnvote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const response = await fetch(`${POST_UNVOTE}/${post?.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          
        });
    
        const data = await response.json();
        if (response.ok) {
          setSuccess(data.message);
          setError(null);
          
          if (hasUpvoted)
          {
              setUpvotes(upvotes - 1);
          }
          else if (hasDownvoted)
          {
            setDownvotes(downvotes - 1);
          }

          setHasDownvoted(false)
          setHasUpvoted(false)
        } 
        else 
        {
          setError(data.message);
          setSuccess(null);
        }
    }

    

    const getPost = async () => {
        const response = await fetch(`${POST_DETAIL}/${id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({current_user_id: currentUserID}),
            }
        )

        const data = await response.json()

        setHasUpvoted(data.has_upvoted !== 0)
        setHasDownvoted(data.has_downvoted !== 0)
        setUpvotes(data.upvotes)
        setDownvotes(data.downvotes)
        setPost(data);
    }

    useEffect(() => {
        getPost();
    }, [])

    return (
        <div id="post-detail">
            <div id="title">
                <h1>{post?.title}</h1>
            </div>
            <div id="messages">
                <Success success={success} />
                <Error error={error} />
            </div>
            <div id="content">
                <p>{post?.content}</p>
            </div>
            <div id="stats">
                <div id="upvotes-container">
                    <span>Upvotes</span>
                    <p>{upvotes}</p>
                    {!hasUpvoted ? (
                            <Form id="upvote-form" action={POST_UPVOTE + `/${post?.id}`} method="POST" onSubmit={handleUpvote}>
                                <Button label="Upvote" type="submit" id="upvote-button"/>
                            </Form>
                        ): (
                            <Form id="upvote-form" action={POST_UNVOTE + `/${post?.id}`} method="POST" onSubmit={handleUnvote}>
                                <Button label="Remove Upvote" type="submit" id="unvote-button"/>
                            </Form>
                    )}
                    
                </div>
                <div id="downvotes-container">
                    <span>Downvotes</span>
                    <p>{downvotes}</p>
                    {!hasDownvoted ? (
                            <Form id="upvote-form" action={POST_UPVOTE + `/${post?.id}`} method="POST" onSubmit={handleDownvote}>
                                <Button label="Downvote" type="submit" id="downvote-button"/>
                            </Form>
                        ): (
                            <Form id="upvote-form" action={POST_UNVOTE + `/${post?.id}`} method="POST" onSubmit={handleUnvote}>
                                <Button label="Remove Downvote" type="submit" id="unvote-button"/>
                            </Form>
                    )}
                </div>
            </div>
            <div id="comments">

            </div>
        </div>
    )
}