import { Link } from "react-router-dom"
import type SubgedditInterface from "../../pages/Subgeddits/List/SubgedditListInterface"
import "./SubgedditCard.css"
import Button from "../DefaultButton/DefaultButton";

export default function SubgedditCard({subgeddit, currentUserID, onDelete}:  {subgeddit: SubgedditInterface, currentUserID: number | null, onDelete: (id: number) => void})
{
    const isOwner = currentUserID === subgeddit.owner_user_id;

    return (
    <div className="subgeddit-card">
        <Link className="subgeddit-body" to={`/subgeddits/${subgeddit.subgeddit_id}`}>
            <h1>{subgeddit.name}</h1>
        </Link>
        <Link className="subgeddit-footer" to={`/profile/${subgeddit.owner_user_id}`}>
            <h3>Owner: {subgeddit.owner}</h3>
        </Link>
        <div className="subgeddit-create-post-wrapper">
            <Link className="subgeddit-create-link" to={`/subgeddits/${subgeddit.subgeddit_id}/post/create`}>Create Post</Link>
            {isOwner && (
                <>
                    <Link
                    className="subgeddit-update-link"
                    to={`/subgeddits/update/${subgeddit.subgeddit_id}`}
                    >
                    Update Subgeddit
                    </Link>
                    <Button
                        label="Delete Subgeddit"
                        onclick={() => onDelete(subgeddit.subgeddit_id)}
                    />
                </>
            )}
        </div>
    </div>
    )
}