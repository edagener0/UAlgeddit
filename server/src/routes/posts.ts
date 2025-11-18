import { Router } from "express";
import jwtAuthMiddleware from "../middleware/jwtAuth";
import { createPost, deletePost, detailPost, downvotePost, listPost, undoVotePost, upvotePost } from "../controllers/posts";

const postsRouter = Router();

postsRouter.post("/create/", jwtAuthMiddleware, async (req, res) => await createPost(req, res))

postsRouter.post("/delete/:id", jwtAuthMiddleware, async (req, res) => await deletePost(req, res))

postsRouter.get("/list", jwtAuthMiddleware, async (req, res) => await listPost(req, res))

postsRouter.post("/detail/:id", jwtAuthMiddleware, async (req, res) => await detailPost(req, res))

postsRouter.post("/upvote/:id", jwtAuthMiddleware, async (req, res) => await upvotePost(req, res))

postsRouter.post("/downvote/:id", jwtAuthMiddleware, async (req, res) => await downvotePost(req, res))

postsRouter.post("/unvote/:id", jwtAuthMiddleware, async (req, res) => await undoVotePost(req, res));



export default postsRouter