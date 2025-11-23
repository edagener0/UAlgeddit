import "./MessageCard.css"
import type MessageI from "./MessageI"

export default function MessageCard({message}: {message: MessageI})
{
    return (
        <div className="message-container">
            <div className="message-user-container">
                <p>{message.username}: </p>
            </div>
            <div className="message-content-container">
                <p>{message.content}</p>
            </div>
        </div>
    )
}