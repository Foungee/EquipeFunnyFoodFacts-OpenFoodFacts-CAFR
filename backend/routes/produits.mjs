import express from "express";
import * as produitsController from "../controllers/produitsController.mjs";

const router = express.Router();

// router.get("/:code", produitsController.getProduitByCode);
router.get("/", produitsController.getProduits);
router.get("/categories", produitsController.getCategories);
router.get("/categorie", produitsController.getProduitsByCategorie);
router.get("/:id", produitsController.getProduit);

export default router;
