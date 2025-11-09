import { Router } from "express";
import jwtAuthMiddleware from "../middleware/jwtAuth";
import { createComment, deleteComment, listComment } from "../controllers/comments";

const commentsRouter = Router();

commentsRouter.post("/create", jwtAuthMiddleware, async (req, res) => await createComment(req, res));

commentsRouter.post("/delete/:id", jwtAuthMiddleware, async (req, res) => await deleteComment(req, res));

commentsRouter.get("/list", jwtAuthMiddleware, async (req, res) => await listComment(req, res));

export default commentsRouter;