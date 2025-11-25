import { Link } from "react-router-dom"
import "./MessageCard.css"
import type MessageI from "./MessageI"

export default function MessageCard({message}: {message: MessageI})
{
    return (
        <div className="message-container">
            <Link to={`/profile/${message.user_id}`} className="message-user-container">
                <p>{message.username}: </p>
            </Link>
            <div className="message-content-container">
                <p>{message.content}</p>
            </div>
        </div>
    )
}