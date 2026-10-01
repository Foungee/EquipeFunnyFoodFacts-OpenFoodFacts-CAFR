import { query } from "./dbController.mjs";

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
      return res.status(404).json({ message: "Produit introuvable" });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
}
