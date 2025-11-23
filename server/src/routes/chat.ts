import { Router } from "express";
import { WebSocket } from "ws";
import jwt from "jsonwebtoken"
import { JWTDecoded } from "../types/JWTDecoded";
import { SECRET_KEY } from "../constants/auth";

const chatRouter = Router();

const clients = new Set<WebSocket>();

export const setupChatWS = () => {
  chatRouter.ws("/global", (ws, req) => {
    try 
    {
        let token = req.query.token || req.headers["sec-websocket-protocol"]
        if (Array.isArray(token)) token = token[0]
        if (typeof token !== "string")
        {
            ws.close(1008, "Authentication token missing")
            return;
        }

        const user = jwt.verify(token, SECRET_KEY) as JWTDecoded
        clients.add(ws)

        ws.on("message", (msg) => {
            const payload = JSON.stringify({username: user.username, message: msg})
            clients.forEach((client) => {
                if (client.readyState === 1)
                {
                    client.send(payload)
                }
            })

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    } 
    catch (error) 
    {
        ws.close(1008, "Authentication failed");
    }
    
    

    
  });
};

export default chatRouter;
