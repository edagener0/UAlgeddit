import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";
import JWTRequest from "../types/JWTRequest";
import { Response } from "express";

export async function createPost(req: JWTRequest, res: Response)
{
    try 
    {
        const title = req.body.title;
        const content = req.body.content;
        const image = req.body.image ?? null;
        const subgedditID = req.body.subgeddit_id

        const subgeddit = await db.getSubgeddit([subgedditID]);
        const profile = await db.getProfile([req.user?.userID]);
        await db.insertPost([title, content, image, subgeddit.id, profile.id]);
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Subgeddit to create post not found."})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
        return
    }

    res.status(201).send({message: "Post created successfully"})
}

export async function deletePost(req: JWTRequest, res: Response)
{
    

    try 
    {
        const postID = req.params.id;
        const profile = await db.getProfile([req.user?.userID])
        await db.deletePost([postID, profile.id]);
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Post not found"})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
        return
    }

    res.status(200).send({message: "Post deleted successfully"})
}

export async function detailPost(req: JWTRequest, res: Response)
{
    try 
    {
        const post = await db.getPost([req.params.id])
        res.status(200).json(post);   
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Post Not Found"})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
    }
}

export async function listPost(req: JWTRequest, res: Response)
{
    try 
    {
        const posts = await db.listPost([]);
        res.status(200).json(posts);
    }
    catch (error) 
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"});    
    }
}

export async function upvotePost(req: JWTRequest, res: Response)
{
    try 
    {
        const postID = req.params.id;
        const profile = await db.getProfile([req.user?.userID])
        const changes = await db.updatePostVote([1, postID, profile.id])
        if (changes === 0)
        {
            await db.upvotePost([postID, profile.id])
        }
        res.status(200).send({message: "Successfully upvoted!"});
    } 
    catch (error) 
    {
        console.log(error)
        res.status(500).send({message: "Internal Server Error"})   
    }
}

export async function downvotePost(req: JWTRequest, res: Response)
{
    

    try 
    {
        const postID = req.params.id;
        const profile = await db.getProfile([req.user?.userID])
        const changes = await db.updatePostVote([-1, postID, profile.id])
        if (changes === 0)
        {
            await db.downvotePost([postID, profile.id])
        }
        res.status(200).send({message: "Successfully downvoted!"});
    } 
    catch (error) 
    {
        console.log(error)
        res.status(500).send({message: "Internal Server Error"})
    }
}

export async function undoVotePost(req: JWTRequest, res: Response)
{
    try 
    {
        const postID = req.params.id
        const profile = await db.getProfile([req.user?.userID])
        await db.deletePostVote([postID, profile.id])
        res.status(200).send({message: "Unvoted successfully"})
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            res.status(404).send({message: error.message})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
    }
}
