import { query } from './dbController.mjs';

export async function getProduitByCode(req, res, next) {
  try {
    const rows = await query(
      `SELECT
            code,
            COALESCE((list_filter(product_name, x -> x.lang = 'fr')[1]).text, product_name[1].text) AS nom,
            quantity                    AS format,
            brands,
            categories,
            nutriscore_grade            AS "nutriScore",
            nova_group                  AS "novaGroupe",
            environmental_score_grade   AS "ecoScore",
            front_image_url             AS image,
            COALESCE((list_filter(ingredients_text, x -> x.lang = 'fr')[1]).text, ingredients_text[1].text) AS ingredients
        FROM produits
        WHERE code = $1
        LIMIT 1`,
      [req.params.code],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// RÉCUPÉRER UN PRODUIT PAR SON ID
export async function getProduit(req, res, next) {
  try {
    const rows = await query(
      `SELECT
        m.title AS nom,
        m.brand AS marque,
        m.image_url AS image,
        m.price AS prix,
        s.taxonomy AS categorie,
        s.nutri_score_status AS "nutriScore",
        n.calories_per_100g AS calories,
        n.fat_g_per_100g AS lipides,
        n.saturated_fat_g_per_100g AS satures,
        n.carbohydrate_g_per_100g AS glucides,
        n.fibre_g_per_100g AS fibre,
        n.sugars_g_per_100g AS sucres,
        n.protein_g_per_100g AS proteines,
        n.cholesterol_mg_per_100g AS cholesterol,
        n.sodium_mg_per_100g AS sodium,
        n.potassium_mg_per_100g AS potassium,
        n.calcium_mg_per_100g AS calcium,
        n.iron_mg_per_100g AS iron,
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       LEFT JOIN my_db.main.nutrition n ON n.external_id = m.external_id
       WHERE m.external_id = $1`,
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    res.status(200).json(rows[0]);
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
