import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";
import JWTRequest from "../types/JWTRequest";
import { Response } from "express";

export async function viewProfile(req: JWTRequest, res: Response)
{
    try 
    {
        const userID = req.params.id;
        if (!userID || !req.user?.userID)
        {
            throw Error("User ids not found.");
        }
        const user = await db.getUserFromId([userID]);
        const areFriends = await db.areFriends(userID, req.user.userID)
        const isFriendRequestPending = await db.existsFriendRequest(req.user.userID, userID);
        const totalFriends = await db.getTotalUserFriendsByUserID([userID]);
        res.status(200).json({...user, areFriends, isFriendRequestPending, totalFriends});
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