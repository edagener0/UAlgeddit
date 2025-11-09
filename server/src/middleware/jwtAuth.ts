import {Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../constants/auth";

import JWTRequest from "../types/JWTRequest";
import { JWTUser } from "../models/JWTUser";


const jwtAuthMiddleware = (req: JWTRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).send("Token required!");

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send("Invalid or expired token");
        req.user = user as JWTUser;
        next();
    });
};

export default jwtAuthMiddleware;