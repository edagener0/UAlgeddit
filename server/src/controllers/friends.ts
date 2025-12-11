import { Response } from "express";
import JWTRequest from "../types/JWTRequest";
import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";

export async function createFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const to_user_id = req.body.to_user_id;
        const to_user = await db.getUserFromId([to_user_id])
        if (to_user.id === req.user?.userID)
        {
            throw new Error("You can't send a friend request to yourself.");
        }
        await db.createFriendshipRequest([req.user?.userID, to_user.id]);
        res.status(201).send({message: "Friendship request successfully sent!"})
    } 
    catch (error) 
    {
        console.log(error)
        res.status(500).send({message: "Internal Server Error"})
    }
}

export async function listReceivedFriendshipRequest(req: JWTRequest, res: Response)
{
    try 
    {
        const friendRequests = await db.listReceivedFriendshipRequest([req.user?.userID]);

        const detailedRequests = await Promise.all(
            friendRequests.map(async (request: any) => {
                const sender = await db.getUserFromId([request.from_user_id]);
                return {
                    ...request,
                    from_username: sender.username
                }
            })
        )
        res.status(200).json(detailedRequests);
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
        const from_user_id = req.body.from_user_id;
        const to_user = await db.getUserFromId([from_user_id])
        await db.acceptFriendshipRequest([to_user.id, req.user?.userID]);
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
        const from_user_id = req.body.from_user_id;
        const to_user = await db.getUserFromId([from_user_id])
        await db.declineFriendshipRequest([to_user.id, req.user?.userID]);
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
        const user_id = req.body.user_id;
        const to_user = await db.getUserFromId([user_id])
        await db.unfriend([to_user.id, req.user?.userID]);
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