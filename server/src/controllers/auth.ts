import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { SALT, SECRET_KEY } from "../constants/auth";
import { db } from "../database/database";
import { UserModel } from "../models/User";
import JWTRequest from "../types/JWTRequest";


export async function login(req: Request, res: Response)
{
    let username = null;
    let password = null;
    try 
    {
        username = req.body.username;
        password = req.body.password;
    } 
    catch (error) 
    {
        res.status(500).send({message: "Internal Server Error"});
        return;
    }

    // Filtrar os utilizadores pelo username.
    let user = null;
    try 
    {
        user = await db.getUser([username])
    } 
    catch (error) 
    {
        res.status(500).send({message: "Internal Server Error on login."})
    }
    
    if (!user)
    {
        res.status(404).send({message: "User Not Found"})
        return;
    }


    // Obter o utilizador 
    
    if (!user)
    {
        res.status(404).send({message: "User Not Found."})
        return;
    }

    // Comparar a palavra-passe fornecida com a palavra-passe guardada na base de dados.
    if (!(await bcrypt.compare(password, user.password)))
    {
        res.status(401).send({message: "Invalid Credentials."})
        return;
    }

    // Enviar o token como resposta.
    const token = jwt.sign({userID: user.id}, SECRET_KEY, {expiresIn: "1h"});
    res.status(200).send({token})
}

export async function register(req: Request, res: Response)
{
    // Inserir o utilizador na base de dados.
    try 
    {
        const username = req.body.username
        const password = req.body.password
        const passwordConfirm = req.body.password_confirm

        if (password != passwordConfirm)
        {
            res.status(400).send({message: "Passwords do not match!"});
            return;
        }

        // Dar hash à password.
        const hashedPassword = await bcrypt.hash(password, SALT);
        await db.insertUser([username, hashedPassword]);
    } 
    catch (error: any) 
    {
        if (error.code === "SQLITE_CONSTRAINT" && error.message.includes("user.username"))
        {
            res.status(409).send({message: "Username is already taken."});
        }
        else
        {
            res.status(500).send({message: "Internal Server Error"});
        }
        return;
    }

    // Enviar resposta de sucesso ao utilizador
    res.status(201).send({message: "User created successfully."});
}

export async function logout(req: JWTRequest, res: Response)
{
    try 
    {
        const authHeader = req.headers["cookie"];
        if (!authHeader) return res.sendStatus(204);
        res.setHeader("Clear-Site-Data", "'cookies'")
        res.status(200).json({message: "Logout successful!"})
    }
    catch (error)
    {
        console.log(error);
        res.status(500).send({message: "Internal Server Error"});
    }
    
}