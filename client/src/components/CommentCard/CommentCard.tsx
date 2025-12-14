import { Link } from "react-router-dom"
import Form from "../Form/Form"
import "./CommentCard.css"
import type { CommentI } from "../../pages/Posts/Detail/CommentInterface"
import Button from "../DefaultButton/DefaultButton"
import { COMMENT_DELETE } from "../../utils/Constants"

export default function CommentCard({comment, currentUserID, handleCommentDelete}: {comment: CommentI, currentUserID: number | null, handleCommentDelete: (e: React.FormEvent<HTMLFormElement>) => void})
{
    return (
        <div className="comment-card">
            <Link to={`/profile/${comment.user_id}`} className="comment-header">User: {comment.username}</Link>
            <div className="comment-footer">
                <p>{comment.content}</p>
            </div>
            {comment.user_id == currentUserID ? (
                <div id="delete-comment-form-wrapper">
                    <Form id="delete-comment-form" action={COMMENT_DELETE + `/${comment.id}`} method="POST" onSubmit={handleCommentDelete}>
                        <Button label="Delete Comment" type="submit"/>
                    </Form>
                </div>
                
            ): (
                <></>
            )}
        </div>
    )
}