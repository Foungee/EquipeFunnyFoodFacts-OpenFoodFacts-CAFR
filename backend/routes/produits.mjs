import express from "express";
import * as produitsController from "../controllers/produitsController.mjs";

const router = express.Router();

router.get("/:code", produitsController.getProduitByCode);

export default router;
