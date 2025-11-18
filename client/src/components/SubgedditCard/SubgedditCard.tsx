import { Link } from "react-router-dom"
import type SubgedditInterface from "../../pages/Subgeddits/List/SubgedditListInterface"
import "./SubgedditCard.css"

export default function SubgedditCard({subgeddit}:  {subgeddit: SubgedditInterface})
{
    return (
    <div className="subgeddit-card">
        <Link className="subgeddit-body" to={`/subgeddits/${subgeddit.subgeddit_id}`}>
            <h1>{subgeddit.name}</h1>
        </Link>
        <div className="subgeddit-footer">
            <h3>Owner: {subgeddit.owner}</h3>
        </div>
        <div className="subgeddit-create-post-wrapper">
            <Link className="subgeddit-create-link" to={`/subgeddits/${subgeddit.subgeddit_id}/post/create`}>Create Post</Link>
        </div>
    </div>
    )
}