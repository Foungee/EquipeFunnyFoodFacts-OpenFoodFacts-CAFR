import {
  getProductById,
  trouverProduits,
  trouverProduitsParCategorie,
} from '../services/produitsService.mjs';
import { query } from './dbController.mjs';

export async function getProduit(req, res, next) {
  try {
    const produit = await getProductById(req.params.id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    res.status(200).json(produit);
  } catch (err) {
    next(err);
  }
}

// RÉCUPÉRER LES PRODUITS (15 pour l'instant)
export async function getProduits(req, res, next) {
  try {
    const {
      recherche,
      search,
      tri,
      nutriScore,
      categorie,
      limit = 15,
    } = req.query;
    const produits = await trouverProduits({
      recherche: recherche || search,
      tri,
      nutriScore,
      categorie,
      limit,
    });

    res.status(200).json(produits);
  } catch (err) {
    next(err);
  }
}

// RÉCUPÉRER TOUS LES PRODUITS SELON UNE CATEGORIE
export async function getProduitsByCategorie(req, res, next) {
  try {
    const { categorie } = req.query;

    if (!categorie) {
      return res
        .status(400)
        .json({ message: 'Le paramètre categorie est requis' });
    }

    const produits = await trouverProduitsParCategorie({categorie})

    res.status(200).json(produits);
  } catch (err) {
    next(err);
  }
}

// RÉCUPÉRER TOUS LES PRODUITS (SANS LIMITE)
export async function getTousLesProduits(req, res, next) {
  try {
    const rows = await query(
      `SELECT
        m.external_id AS id,
        m.title AS nom,
        m.brand AS marque,
        m.image_url AS image,
        m.price AS prix,
        s.taxonomy AS categorie,
        s.nutri_score_status AS "nutriScore"
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       ORDER BY m.title ASC`,
    );

    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
}
// Nombre de produits par catégorie pour l'accueil.
export async function getCategories(req, res, next) {
  try {
    const rows = await query(
      `SELECT
        s.taxonomy AS code,
        COUNT(DISTINCT m.external_id) AS nombre
       FROM my_db.main.metadata m
       INNER JOIN my_db.main.scores s
         ON s.external_id = m.external_id
       WHERE s.taxonomy IS NOT NULL
       GROUP BY s.taxonomy
       ORDER BY s.taxonomy`,
    );

    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
}
