import { Request } from "express"
import { JWTUser } from "../models/JWTUser";

interface JWTRequest extends Request {
    user?: JWTUser
}

export default JWTRequest;