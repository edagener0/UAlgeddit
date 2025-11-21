import { Link } from "react-router-dom"
import Form from "../Form/Form"
import "./CommentCard.css"
import type { CommentI } from "../../pages/Posts/Detail/CommentInterface"
import Button from "../DefaultButton/DefaultButton"
import { COMMENT_DELETE } from "../../utils/Constants"
import type { Dispatch, SetStateAction } from "react"

export default function CommentCard({comment, currentUserID, token, getComments, setSuccess, setError}: {comment: CommentI, currentUserID: number | null, token: string | null, getComments: () => void, setSuccess: Dispatch<SetStateAction<string | null>>, setError: Dispatch<SetStateAction<string | null>>})
{
    const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!window.confirm("Are you sure you'd like to delete this comment?")) return;
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
            getComments();
            setSuccess("Comment deleted successfully!")
            setError(null)
        }
        else
        {
            setError("Error on comment delete!")
            setSuccess(null);
        }
    }

    return (
        <div className="comment-card">
            <Link to="/profile" className="comment-header">User: {comment.username}</Link>
            <div className="comment-footer">
                <p>{comment.content}</p>
            </div>
            {comment.user_id == currentUserID ? (
                <div id="delete-comment-form-wrapper">
                    <Form id="delete-comment-form" action={COMMENT_DELETE + `/${comment.id}`} method="POST" onSubmit={handleDelete}>
                        <Button label="Delete Comment" type="submit"/>
                    </Form>
                </div>
                
            ): (
                <></>
            )}
        </div>
    )
}