import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";
import JWTRequest from "../types/JWTRequest";
import { Response } from "express";

export async function createComment(req: JWTRequest, res: Response)
{
    try 
    {
        const content = req.body.content;
        if (content.trim() == "") throw new Error("You can't create empty comments.")
        const postID = req.body.post_id;

        // verificar se o post e o perfil existem
        const post = await db.getPost([req.user?.userID, req.user?.userID, postID])

        await db.createComment([content, post.id, req.user?.userID])
        res.status(201).send({message: "Comment created successfully"})
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Post or profile to create comment not found."})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
    }
}

export async function deleteComment(req: JWTRequest, res: Response)
{
    try 
    {
        const commentID = req.params.id
        await db.deleteComment([commentID, req.user?.userID])
        res.status(200).send({message: "Comment deleted successfully"})
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Comment to delete not found"});
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"});
        }
    }
}


export async function listComment(req: JWTRequest, res: Response)
{
    try 
    {
        const postID = req.params.post_id;
        const comments = await db.listComment([postID]);
        res.status(200).json(comments)
    } 
    catch (error) 
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"})
    }
}