import { Router } from "express";
import jwtAuthMiddleware from "../middleware/jwtAuth";
import { acceptFriendshipRequest, createFriendshipRequest, declineFriendshipRequest, listReceivedFriendshipRequest, unfriend } from "../controllers/friends";

const friendsRouter = Router();

friendsRouter.post("/request", jwtAuthMiddleware, async (req, res) => await createFriendshipRequest(req, res));

friendsRouter.get("/request/list", jwtAuthMiddleware, async (req, res) => await listReceivedFriendshipRequest(req, res));

friendsRouter.post("/request/accept/", jwtAuthMiddleware, async (req, res) => await acceptFriendshipRequest(req, res));

friendsRouter.post("/request/decline/", jwtAuthMiddleware, async (req, res) => await declineFriendshipRequest(req, res));

friendsRouter.post("/unfriend", jwtAuthMiddleware, async (req, res) => await unfriend(req, res));
export default friendsRouter;