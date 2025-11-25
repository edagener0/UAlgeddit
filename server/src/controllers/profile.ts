import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";
import JWTRequest from "../types/JWTRequest";
import { Response } from "express";

export async function viewProfile(req: JWTRequest, res: Response)
{
    try 
    {
        const userID = req.params.id;
        const user = await db.getUserFromId([userID]);
        res.status(200).json(user);
    }
    catch (error) 
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"});    
    }
}

export async function updateProfile(req: JWTRequest, res: Response)
{
    try 
    {
        const {biography, birthday} = req.body
        await db.updateUserProfile([biography, birthday, req.user?.userID])
        return res.status(200).json({message: "Profile updated successfully!"})
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            return res.status(404).json({message: "User not found!"})
        }
        else
        {
            return res.status(500).json({message: "Internal Server Error"})
        }
    }
    

}