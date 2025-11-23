import { useState } from "react"
import Button from "../../components/DefaultButton/DefaultButton"

import "./Chat.css"
import Form from "../../components/Form/Form"
import MessageCard from "../../components/MessageCard/MessageCard"
import type MessageI from "../../components/MessageCard/MessageI"
import TextField from "../../components/TextField/TextField"
import { handleTextAreaKeyDown } from "../../utils/Inputs"

export default function Chat({username}: {username: string | null})
{
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState<MessageI[]>([])

    const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log(message)
        if (!message.trim()) return;
        const userUsername = username ?? "Anonymous";
        setMessages(prev => [...prev, {username: userUsername, content: message}])
        setMessage("")

    }
    
    return (
        <div className="chat-container">
            <h1>Real Time Chat</h1>
                <div id="messages-container">
                    {messages.map((message, index) => {
                        return <MessageCard message={message} key={index}/>
                    })}
                </div>
            <div className="message-input">
                <Form id="message-form" onSubmit={sendMessage}>
                    <TextField name="message-content" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleTextAreaKeyDown}/>
                    <Button type="submit" label="Send"></Button>
                </Form>
            </div>
            
        </div>
    )
}