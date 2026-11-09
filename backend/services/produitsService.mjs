import { query } from '../controllers/dbController.mjs';

export async function getProductById(id) {
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
        n.iron_mg_per_100g AS iron
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       LEFT JOIN my_db.main.nutrition n ON n.external_id = m.external_id
       WHERE m.external_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
