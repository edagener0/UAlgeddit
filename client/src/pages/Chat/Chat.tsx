import { useEffect, useState } from "react"
import Button from "../../components/DefaultButton/DefaultButton"
import "./Chat.css"
import Form from "../../components/Form/Form"
import MessageCard from "../../components/MessageCard/MessageCard"
import type MessageI from "../../components/MessageCard/MessageI"
import TextField from "../../components/TextField/TextField"
import { handleTextAreaKeyDown } from "../../utils/Inputs"
import { GLOBAL_CHAT_WS_URL } from "../../utils/Constants"

export default function Chat({token}: {token: string | null})
{
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState<MessageI[]>([])
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!token) return;
        
        const timer = setTimeout(() => {
            const websocket = new WebSocket(`${GLOBAL_CHAT_WS_URL}?token=${token}`);
            setWs(websocket);

            websocket.onmessage = (event) => {
                const received = JSON.parse(event.data)
                setMessages((prevMessages) => [...prevMessages, {username: received.username, content: received.message}]);
            };
        }, 100)
        return () => clearTimeout(timer);
    }, [token]);
  
    const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (ws && ws.readyState === WebSocket.OPEN) 
        {
            if (!message.trim()) return;
            ws.send(message)
            setMessage("")
        }
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