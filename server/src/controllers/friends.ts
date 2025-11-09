import { Response } from "express";
import JWTRequest from "../types/JWTRequest";
import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";

export async function createFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const from_profile = await db.getProfile([req.user?.userID]);
        const to_profile_id = req.body.to_profile;
        const to_profile = await db.getProfile([to_profile_id])
        if (to_profile.id === from_profile.id)
        {
            throw new Error("You can't send a friend request to yourself.");
        }
        await db.createFriendshipRequest([from_profile.id, to_profile.id]);
        res.status(201).send({message: "Friendship request successfully sent!"})
    } 
    catch (error) 
    {
        console.log(error)
        res.status(500).send({message: "Internal Server Error"})
        // TODO falta 1 trigger para os friendships. 
        // Quando é inserida uma nova friendship respetivo friendship request deve ser eliminado.
    }
}

export async function listReceivedFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const profile = await db.getProfile([req.user?.userID]);
        const friendRequests = await db.listReceivedFriendshipRequest([profile.id]);
        res.status(200).json(friendRequests);
    } 
    catch (error) 
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"});
    }
}

export async function acceptFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const from_profile_id = req.body.from_profile_id;
        const to_profile = await db.getProfile([req.user?.userID]);
        const from_profile = await db.getProfile([from_profile_id]);
        await db.acceptFriendshipRequest([from_profile.id, to_profile.id]);
        res.status(200).send({message: "Friend request accepted successfully."})
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Friend Request to accept Not Found"});
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"});
        }
    }
}

export async function declineFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const from_profile_id = req.body.from_profile_id;
        const to_profile = await db.getProfile([req.user?.userID]);
        const from_profile = await db.getProfile([from_profile_id]);
        await db.declineFriendshipRequest([from_profile.id, to_profile.id]);
        res.status(200).send({message: "Friend Request declined successfully."})
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Friend Request to decline not found."});
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"});
        }
        
    }
}

export async function unfriend(req: JWTRequest, res: Response)
{
    try 
    {
        const from_profile_id = req.body.profile_id;
        const to_profile = await db.getProfile([req.user?.userID]);
        const from_profile = await db.getProfile([from_profile_id]);
        
        await db.unfriend([to_profile.id, from_profile.id]);
        res.status(200).send({message: "Successfully unfriended."});
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "You are not friends with this user."})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
    }
}