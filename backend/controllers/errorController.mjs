export const get404 = (req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: 'Ressource non trouvée',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

/**
 * PERMET DE RÉCUPÉRER TOUTES LES ERREURS
 *
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const getErrors = (err, req, res, next) => {
  
  if (err.type === 'entity.parse.failed') {
    err.statusCode = 400;
    err.message = "Le corps de la requête n'est pas un JSON valide";
  }

  const status = err.statusCode || 500;

  const message = status === 500 ? 'Erreur interne du serveur' : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    status,
    error: status === 500 ? 'Internal Server Error' : err.name,
    message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};
