import { query } from '../controllers/dbController.mjs';

const COLONNES_NUTRIMENTS = {
  sodium: { g: 'n.sodium_mg_per_100g', ml: 'n.sodium_mg_per_100ml' },
  calories: { g: 'n.calories_per_100g', ml: 'n.calories_per_100ml' },
  proteines: { g: 'n.protein_g_per_100g', ml: 'n.protein_g_per_100ml' },
};

export async function getProductById(id) {
  const rows = await query(
    `SELECT
        m.title AS nom,
        m.brand AS marque,
        m.image_url AS image,
        m.price AS prix,
        s.taxonomy AS categorie,
        s.nutri_score_status AS "nutriScore",
        CASE
        WHEN n.calories_per_100g IS NOT NULL THEN 'g'
        WHEN n.calories_per_100ml IS NOT NULL THEN 'ml'
        END AS unite,
        COALESCE(n.calories_per_100g, n.calories_per_100ml) AS calories,
        COALESCE(n.fat_g_per_100g, n.fat_g_per_100ml) AS lipides,
        COALESCE(n.saturated_fat_g_per_100g,n.saturated_fat_g_per_100ml) AS satures,
        COALESCE(n.carbohydrate_g_per_100g,n.carbohydrate_g_per_100ml) AS glucides,
        COALESCE(n.fibre_g_per_100g,n.fibre_g_per_100ml) AS fibre,
        COALESCE(n.sugars_g_per_100g,n.sugars_g_per_100ml) AS sucres,
        COALESCE(n.protein_g_per_100g,n.protein_g_per_100ml) AS proteines,
        COALESCE(n.cholesterol_mg_per_100g,n.cholesterol_mg_per_100ml) AS cholesterol,
        COALESCE(n.sodium_mg_per_100g,n.sodium_mg_per_100ml) AS sodium,
        COALESCE(n.potassium_mg_per_100g,n.potassium_mg_per_100ml) AS potassium,
        COALESCE(n.calcium_mg_per_100g,n.calcium_mg_per_100ml) AS calcium,
        COALESCE(n.iron_mg_per_100g,n.iron_mg_per_100ml) AS iron
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       LEFT JOIN my_db.main.nutrition n ON n.external_id = m.external_id
       WHERE m.external_id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function trouverProduits({
  recherche,
  tri,
  ordre,
  nutriScore,
  categorie,
  limit,
  unite,
  filtres = {},
}) {
  const uniteValide = unite === 'ml' ? 'ml' : 'g';
  let requete = `
      SELECT
        m.external_id AS id,
        m.title AS nom,
        m.brand AS marque,
        m.image_url AS image,
        m.price AS prix,
        s.taxonomy AS categorie,
        s.nutri_score_status AS "nutriScore",
        '${uniteValide}' AS unite,
        ${COLONNES_NUTRIMENTS.sodium[uniteValide]} AS sodium,
        ${COLONNES_NUTRIMENTS.calories[uniteValide]} AS calories,
        ${COLONNES_NUTRIMENTS.proteines[uniteValide]} AS proteines
       FROM my_db.main.metadata m
       LEFT JOIN my_db.main.scores s ON s.external_id = m.external_id
       LEFT JOIN my_db.main.nutrition n ON n.external_id = m.external_id
       WHERE 1=1
    `;

  const params = [];
  let paramIndex = 1;

  if (recherche) {
    requete += ` AND m.title ILIKE $${paramIndex++}`;
    params.push(`%${recherche}%`);
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
  
  // UNITE : ne garder que les produits ayant des données dans l'unité choisie
  requete += ` AND ${COLONNES_NUTRIMENTS.calories[uniteValide]} IS NOT NULL`;

  // SEUILS NUTRITIONNELS (Min / Max)
  const operateurs = [
    ['Min', '>='],
    ['Max', '<='],
  ];

  for (const nom of Object.keys(COLONNES_NUTRIMENTS)) {
    const colonneNutriment = COLONNES_NUTRIMENTS[nom][uniteValide];

    for (const [suffixe, operateur] of operateurs) {
      const brut = filtres[`${nom}${suffixe}`];

      if (brut === undefined || brut === '') {
        continue;
      }

      const valeur = Number(brut);

      if (!Number.isFinite(valeur) || valeur < 0) {
        continue;
      }

      requete += ` AND ${colonneNutriment} ${operateur} $${paramIndex++}`;
      params.push(valeur);
    }
  }

  // TRI
  const colonnesTri = {
    az: 'm.title',
    marque: 'm.brand',
    sodium: COLONNES_NUTRIMENTS.sodium[uniteValide],
    calories: COLONNES_NUTRIMENTS.calories[uniteValide],
    proteines: COLONNES_NUTRIMENTS.proteines[uniteValide],
  };

  const colonne = Object.hasOwn(colonnesTri, tri)
    ? colonnesTri[tri]
    : 'm.title';
  const sens = ordre === 'desc' ? 'DESC' : 'ASC';
  requete += ` ORDER BY ${colonne} ${sens} NULLS LAST`;

  // LIMITE
  let nombre = parseInt(limit, 10);
  if (Number.isNaN(nombre) || nombre < 1) {
    nombre = 15;
  }

  requete += ` LIMIT $${paramIndex++}`;
  params.push(nombre);

  return await query(requete, params);
}

export async function trouverProduitsParCategorie({ categorie }) {
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

  return rows;
}

export async function getAllProducts() {
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

  return rows;
}

export async function countProductByCategorie() {
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

  return rows;
}
