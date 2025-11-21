import { Response } from "express";
import JWTRequest from "../types/JWTRequest";
import { db } from "../database/database";
import { NotFound } from "../exceptions/NotFound";


export async function createSubgeddit(req: JWTRequest, res: Response)
{
    try 
    {
        const name = req.body.name
        if (name.trim() === "") throw new Error("Empty content")
        await db.insertSubgeddit([name, req.user?.userID]);     
    } 
    catch (error) 
    {
        res.status(500).send({message: "Internal Server Error."})
        console.log(error)
        return;
    }

    res.status(201).send({message: "Subgeddit created successfully."});
}

export async function updateSubgeddit(req: JWTRequest, res: Response)
{
    try 
    {
        const subgedditID = req.params.id;
        const name = req.body.name;
        await db.updateSubgeddit({id: subgedditID, name: name, userID: req.user?.userID});
    }
    catch (error) 
    {
        console.log(error);
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Subgeddit Not Found"});
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
        return;
    }

    res.status(200).send({message: "Subgeddit updated successfully"})
}

export async function listSubgeddit(req: JWTRequest, res: Response)
{
    let subgeddits = [];
    
    try 
    {
        subgeddits = await db.listSubgeddit([]);
    } 
    catch (error) 
    {
        console.log(error)
        res.status(500).send({message: "Internal Server Error"})
        return;
    }

    res.status(200).json(subgeddits)
}

export async function detailSubgeddit(req: JWTRequest, res: Response)
{
    
    try 
    {
        const subgedditID = req.params.id;
        const posts = await db.listPostForSubgeddit([subgedditID]);
        res.status(200).json(posts);
    }
    catch (error) 
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"});    
    }
}

export async function deleteSubgeddit(req: JWTRequest, res: Response)
{
    try 
    {
        const subgedditID = req.params.id
        await db.deleteSubgeddit([subgedditID, req.user?.userID]);
    } 
    catch (error) 
    {
        console.log(error)
        if (error instanceof NotFound)
        {
            res.status(404).send({message: "Subgeddit Not Found"})
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"})
        }
        return
    }
    res.status(200).send({message: "Subgeddit deleted successfully"})
}