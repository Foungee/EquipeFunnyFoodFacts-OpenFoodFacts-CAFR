import express from "express";
import * as produitsController from "../controllers/produitsController.mjs";

const router = express.Router();

// router.get("/:code", produitsController.getProduitByCode);

router.get("/", produitsController.getProduits)
router.get("/:id", produitsController.getProduit)


export default router;
