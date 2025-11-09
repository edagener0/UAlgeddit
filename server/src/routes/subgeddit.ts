import { Router } from "express";
import { createSubgeddit, deleteSubgeddit, listSubgeddit, updateSubgeddit } from "../controllers/subgeddit";
import jwtAuthMiddleware from "../middleware/jwtAuth";

const subgedditRouter = Router();

subgedditRouter.post("/create", jwtAuthMiddleware, async (req, res) => await createSubgeddit(req, res));
subgedditRouter.post("/update/:id", jwtAuthMiddleware, async (req, res) => await updateSubgeddit(req, res));
subgedditRouter.get("/list/", jwtAuthMiddleware, async (req, res) => await listSubgeddit(req, res));
subgedditRouter.post("/delete/:id", jwtAuthMiddleware, async (res, req) => deleteSubgeddit(res, req));

export default subgedditRouter;