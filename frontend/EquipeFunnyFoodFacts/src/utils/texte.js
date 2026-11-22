export function normaliser(texte) {
  return String(texte).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function versListe(valeur) {
  if (Array.isArray(valeur)) return valeur.map((v) => String(v).trim()).filter(Boolean)
  if (typeof valeur === 'string') return valeur.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
  return []
}