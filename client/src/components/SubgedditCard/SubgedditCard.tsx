import { Link } from "react-router-dom"
import type SubgedditInterface from "../../pages/Subgeddits/List/SubgedditListInterface"
import "./SubgedditCard.css"

export default function SubgedditCard({subgeddit, currentUserID}:  {subgeddit: SubgedditInterface, currentUserID: number | null})
{
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
            {currentUserID === subgeddit.owner_user_id ? (
                <Link className="subgeddit-update-link" to={`/subgeddits/update/${subgeddit.subgeddit_id}`}>Update Subgeddit</Link>
            ): (
                <></>
            )}
        </div>
    </div>
    )
}