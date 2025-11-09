import { Router } from "express";
import { login, logout, register } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/login", async (req, res) => await login(req, res));

authRouter.post("/register", async(req, res) => await register(req, res));

authRouter.post("/logout", async (req, res) => await logout(req, res));

export default authRouter;