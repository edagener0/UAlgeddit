import { useEffect, useState } from "react"
import "./PostDetail.css"
import { type PostDetailI } from "./PostDetailInterface"
import { COMMENT_CREATE, COMMENT_LIST, POST_DELETE, POST_DETAIL, POST_DOWNVOTE, POST_UNVOTE, POST_UPVOTE } from "../../../utils/Constants";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/DefaultButton/DefaultButton";
import Form from "../../../components/Form/Form";
import Success from "../../../components/Messages/Success/Success";
import Error from "../../../components/Messages/Error/Error";
import { type CommentI } from "./CommentInterface";
import CommentCard from "../../../components/CommentCard/CommentCard";
import TextField from "../../../components/TextField/TextField";

export default function PostDetail({token, currentUserID}: {token: string | null, currentUserID: number | null})
{
    const {id} = useParams();
    const [post, setPost] = useState<PostDetailI | null>(null);

    const [comments, setComments] = useState<CommentI[]>([]);
    const [commentContent, setCommentContent] = useState<string>("");

    const [upvotes, setUpvotes] = useState(0);
    const [downvotes, setDownvotes] = useState(0);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [hasDownvoted, setHasDownvoted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleUpvote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const url = e.currentTarget.action;
        const response = await fetch(url, {
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
        const url = e.currentTarget.action;
        const response = await fetch(url, {
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
        const url = e.currentTarget.action;
        const response = await fetch(url, {
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

    const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!window.confirm("Are you sure you'd like to delete this post?")) return;
      const url = e.currentTarget.action;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status == 200)
        {
          navigate("/posts");
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
        
        if (response.status == 200)
        {
          setHasUpvoted(data.has_upvoted !== 0)
          setHasDownvoted(data.has_downvoted !== 0)
          setUpvotes(data.upvotes)
          setDownvotes(data.downvotes)
          setPost(data);
        }
        
    }

    const getComments = async () => {
      const response = await fetch(`${COMMENT_LIST}/${post?.id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            }
        )

        const data = await response.json()
        if (response.status == 200)
        {
          setComments(data);
        }
    }

    const createComment = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const url = e.currentTarget.action
      const response = await fetch(url,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({content: commentContent, post_id: post?.id})
            }
        )
      const data = await response.json();  
      if (response.status == 201)
      {
        setSuccess(data.message);
        setError(null);
        getComments();
        setCommentContent("")
      }
      else
      {
        setError(data.message);
        setSuccess(null);
      }
    }

    useEffect(() => {
        getPost();
    }, [])

    useEffect(() => {
      if (post?.id) 
      {
        getComments();
      }
    }, [post]);

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
            <div id="actions">
                {currentUserID == post?.user_id ? (
                  <Form id="delete-post-form" action={POST_DELETE + `/${post?.id}`} method="POST" onSubmit={handleDelete}>
                    <Button label="Delete Post" type="submit" id="delete-button"/>
                  </Form>
                ): (
                <div>
                </div>
              )}
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
                            <Form id="upvote-form" action={POST_DOWNVOTE + `/${post?.id}`} method="POST" onSubmit={handleDownvote}>
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
              <div id="comment-create-container">
                    <Form id="comment-create-form" action={COMMENT_CREATE} method="POST" onSubmit={createComment}>
                      <TextField name="content" value={commentContent} onChange={(e) => setCommentContent(e.target.value)}></TextField>
                      <Button label="Create Comment" type="submit" id="comment-button"/>
                    </Form>
              </div>
              <div id="comments-display">
                <h1 id="comment-display-title">Comments</h1>
                {comments.map((comment, index) => {
                  return <CommentCard key={index} comment={comment} currentUserID={currentUserID} token={token} getComments={getComments} setSuccess={setSuccess} setError={setError}/>
                })}
              </div>
            </div>
        </div>
    )
}