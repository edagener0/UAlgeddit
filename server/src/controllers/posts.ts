import { db } from "../database/database";
import { Empty } from "../exceptions/Empty";
import { NotFound } from "../exceptions/NotFound";
import JWTRequest from "../types/JWTRequest";
import { Response } from "express";

export async function createPost(req: JWTRequest, res: Response)
{
    try 
    {
        const title = req.body.title;
        const content = req.body.content;
        if (title.trim() === "" || content.trim() === "") throw new Empty("Empty title or content on post")
        const subgedditID = req.body.subgeddit_id
        const subgeddit = await db.getSubgeddit([subgedditID]);
        await db.insertPost([title, content, subgeddit.id, req.user?.userID]);
    } 
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Subgeddit to create post not found."})
        }
        else if (error instanceof Empty)
        {
            res.status(400).send({message: error.message})
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
        await db.deletePost([postID, req.user?.userID]);
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
        const current_user_id = req.body.current_user_id
        const post = await db.getPost([current_user_id, current_user_id, req.params.id])
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
        const changes = await db.updatePostVote([1, postID, req.user?.userID])
        const post = await db.getPost([req.user?.userID, req.user?.userID, postID])
        if (changes === 0)
        {
            await db.upvotePost([post.id, req.user?.userID])
        }
        res.status(200).send({message: "Successfully upvoted!"});
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

export async function downvotePost(req: JWTRequest, res: Response)
{
    try 
    {
        const postID = req.params.id;
        const changes = await db.updatePostVote([-1, postID, req.user?.userID])
        const post = await db.getPost([req.user?.userID, req.user?.userID, postID])
        if (changes === 0)
        {
            await db.downvotePost([post.id, req.user?.userID])
        }
        res.status(200).send({message: "Successfully downvoted!"});
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

export async function undoVotePost(req: JWTRequest, res: Response)
{
    try 
    {
        const postID = req.params.id
        await db.deletePostVote([postID, req.user?.userID])
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
