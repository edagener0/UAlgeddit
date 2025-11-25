import { updateProfile, viewProfile } from "../controllers/profile";
import { Router } from "express";
import jwtAuthMiddleware from "../middleware/jwtAuth";
import { profile } from "console";



const profileRouter = Router();

profileRouter.get("/view/:id", jwtAuthMiddleware, async (req, res) => await viewProfile(req, res));
profileRouter.post("/update/", jwtAuthMiddleware, async(req, res) => await updateProfile(req, res));

export default profileRouter;