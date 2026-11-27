import {
  countProductByCategorie,
  getAllProducts,
  getProductById,
  trouverProduits,
  trouverProduitsParCategorie,
} from '../services/produitsService.mjs';

export async function getProduit(req, res, next) {
  try {
    const produit = await getProductById(req.params.id);

    if (!produit) {
      const err = new Error('Produit introuvable')
      err.statusCode = 404
      return next(err)
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

    const produits = await getAllProducts()

    res.status(200).json(produits);
  } catch (err) {
    next(err);
  }
}
// Nombre de produits par catégorie pour l'accueil.
export async function getCategories(req, res, next) {
  try {
    const produits = await countProductByCategorie()

    res.status(200).json(produits);
  } catch (err) {
    next(err);
  }
}
