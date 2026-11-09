import { getProductById } from '../services/produitsService.mjs';
import { query } from './dbController.mjs';

export async function getProduit(req, res, next) {
  try {

    const produit = getProductById(req.params.id)

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
    const searchParam = req.query.recherche || req.query.search;
    const { tri, nutriScore, categorie, limit = 15 } = req.query;
    let requete = `
      SELECT
        m.external_id AS id,
        m.title AS nom,
        m.brand AS marque,
        m.image_url AS image,
        m.price AS prix,
        s.taxonomy AS categorie,
        s.nutri_score_status AS "nutriScore"
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       LEFT JOIN my_db.main.nutrition n ON n.external_id = m.external_id
       WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (searchParam) {
      requete += ` AND m.title ILIKE $${paramIndex++}`;
      params.push(`%${searchParam}%`);
    }

    // NUTRI ???
    if (nutriScore) {
      requete += ` AND s.nutri_score_status = $${paramIndex++}`;
      params.push(nutriScore);
    }

    // CATEGORIE
    if (categorie) {
      requete += ` AND s.taxonomy = $${paramIndex++}`;
      params.push(categorie);
    }

    // TRI ALPHABETIQUE
    if (tri === 'az') {
      requete += ` ORDER BY m.title ASC`;
    } else if (tri === 'marque') {
      requete += ` ORDER BY m.brand ASC`;
    } else {
      requete += ` ORDER BY m.title ASC`;
    }

    // LIMITE
    requete += ` LIMIT $${paramIndex++}`;
    params.push(parseInt(limit, 10));

    const rows = await query(requete, params);

    res.status(200).json(rows);
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
       WHERE s.taxonomy = $1
       ORDER BY m.title ASC`,
      [categorie],
    );

    res.status(200).json(rows);
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
