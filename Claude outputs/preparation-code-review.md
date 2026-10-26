# Préparation code review, EquipeFunnyFoodFacts

Ce qu'on te demande : être capable d'expliquer ton code et de dire si tu aurais pu le faire d'une autre façon. Ci-dessous, pour chaque morceau que tu as codé, trois choses : ce que ça fait, pourquoi tu l'as fait ainsi, et une ou deux alternatives possibles (pour montrer que tu as réfléchi au choix, pas juste copié quelque chose).

## 1. Correction des noms de colonnes (branche fix/nutrition-colonnes, PR #15)

**Ce que ça fait**
Ton collègue avait réécrit le backend, mais les requêtes utilisaient des noms de colonnes qui n'existaient pas dans la vraie base MotherDuck (`energy_kcal_per_100g` au lieu de `calories_per_100g`, `proteins_g_per_100g` au lieu de `protein_g_per_100g`). Résultat : une erreur `Binder Error` quand on appelait `GET /produits/:id`. Tu as corrigé les noms dans la requête SQL pour qu'ils correspondent au vrai schéma.

**Pourquoi ainsi**
Erreur de nommage, pas une erreur de logique. La bonne pratique est de vérifier le schéma réel (tu l'as fait via l'interface MotherDuck) plutôt que de deviner les noms de colonnes.

**Si on te demande "aurais-tu pu faire autrement"**
Oui : on pourrait créer une vue SQL (`CREATE VIEW`) dans MotherDuck qui renomme les colonnes une fois pour toutes, pour que le code applicatif ne dépende jamais des noms bruts des tables. Avantage : si le schéma change encore, un seul endroit à corriger. Inconvénient : ça ajoute une couche de plus à maintenir et il faut avoir les droits pour créer des vues dans la base.

## 2. La requête getProduit (backend, produitsController.mjs)

**Ce que ça fait**
Récupère un produit par son id en joignant trois tables : `metadata` (nom, marque, image, prix), `scores` (catégorie, statut Nutri-Score) et `nutrition` (calories, protéines, lipides, glucides), reliées par `external_id`.

```sql
SELECT m.title AS nom, m.brand AS marque, ...
FROM metadata m
LEFT JOIN scores s ON s.external_id = m.external_id
LEFT JOIN nutrition n ON n.external_id = m.external_id
WHERE m.external_id = $1
```

**Pourquoi LEFT JOIN et pas INNER JOIN**
Avec un INNER JOIN, un produit qui n'a pas encore de score ou de données nutritionnelles disparaîtrait complètement du résultat. Avec LEFT JOIN, le produit s'affiche quand même, avec `null` pour les champs manquants. C'est important ici parce que les données sont incomplètes pour plusieurs produits (ex : `ingredients_text` est NULL pour presque tous).

**Alternative possible**
On aurait pu faire trois requêtes séparées (une par table) côté backend ou même côté frontend, puis assembler les résultats en JavaScript. Moins efficace (plusieurs allers-retours à la base) mais plus simple à déboguer table par table. Le JOIN unique est plus performant parce que c'est une seule requête, mais plus difficile à lire si on n'est pas habitué au SQL.

**Paramétrage ($1, pas d'injection directe)**
Tu utilises `$1` avec un tableau de paramètres plutôt que de construire une chaîne SQL en concaténant `req.params.id` directement. C'est pour éviter les injections SQL. Si on te demande ce que ça veut dire : quelqu'un pourrait mettre du code SQL malicieux dans l'URL si tu collais sa valeur directement dans la requête ; en passant par les paramètres, la base traite toujours la valeur comme une donnée, jamais comme du code.

## 3. Le store Pinia du comparateur (stores/comparateur.js)

**Ce que ça fait**
Garde en mémoire (pas dans localStorage) jusqu'à 2 produits sélectionnés pour comparaison. Si on ajoute un 3e produit alors que le comparateur est plein, le plus ancien est automatiquement retiré (`shift()`).

**Pourquoi Pinia et pas localStorage**
Le projet utilise déjà Pinia pour un autre store (`counter.js`), donc c'est cohérent avec ce que l'équipe utilise déjà. Pinia donne aussi la réactivité automatique : dès que `produits` change, tous les composants qui l'utilisent se mettent à jour sans code supplémentaire.

**Pourquoi pas localStorage**
localStorage persiste après un rafraîchissement de la page, mais il faut gérer soi-même la sérialisation (JSON.stringify/parse) et ce n'est pas réactif par défaut (il faut un wrapper ou un `watch` pour que l'interface se mette à jour). Pour une comparaison ponctuelle entre deux produits, perdre la sélection au rafraîchissement n'est pas un vrai problème, donc la mémoire simple suffisait.

**Alternative pour la limite de 2 produits**
Au lieu de retirer automatiquement le plus ancien (FIFO), on aurait pu bloquer l'ajout et avertir l'utilisateur ("Retire un produit avant d'en ajouter un autre") ou ouvrir une petite boîte de dialogue pour choisir lequel remplacer. Tu as choisi l'éviction automatique pour que ça reste simple et fluide, sans interrompre l'utilisateur avec un message d'erreur.

## 4. Intégration dans la fiche produit (ProductDetailView.vue)

**Ce que ça fait**
Le bouton "Ajouter au comparateur" appelle `comparateur.ajouter(...)` avec les données déjà chargées pour ce produit, puis redirige automatiquement vers `/comparateur` avec `router.push('/comparateur')`.

**Pourquoi rediriger automatiquement**
Pour que l'utilisateur voie immédiatement le résultat de son action (confirmation visuelle), au lieu de rester sur la fiche produit en se demandant si ça a fonctionné.

**Alternative**
On aurait pu rester sur la page et afficher un petit message de confirmation ("Produit ajouté !") avec un lien vers le comparateur, pour laisser l'utilisateur continuer à naviguer s'il le souhaite. C'est un choix d'expérience utilisateur : la redirection immédiate est plus directe, mais un peu plus intrusive.

## 5. Erreur useRouter oubliée

**Ce qui s'est passé**
Tu avais ajouté l'appel `router.push('/comparateur')` sans importer `useRouter` ni créer la variable `router`. Ça n'a pas fait d'erreur visible immédiatement, mais la redirection ne fonctionnait simplement pas.

**Si on te demande comment tu l'as trouvé**
En relisant le fichier au complet pour vérifier que toutes les pièces nécessaires à `router.push` étaient bien là (l'import, l'instanciation, puis l'appel). C'est un bon réflexe à mentionner : quand quelque chose ne fait rien sans erreur, vérifier que toutes les dépendances de la fonction utilisée sont bien présentes.

## Questions probables, et comment y répondre simplement

- "Pourquoi un store Pinia plutôt que des props entre composants ?" : Parce que la sélection de produits doit être visible depuis deux pages différentes (la fiche produit et la page comparateur) qui ne sont pas parent/enfant. Un store centralisé évite de faire remonter et redescendre l'information à travers plusieurs composants.
- "Pourquoi limiter à 2 produits ?" : Décision de design pour garder l'interface de comparaison simple (deux colonnes côte à côte). Rien n'empêcherait techniquement d'en permettre plus, ce serait juste un tableau avec plus de colonnes.
- "Pourquoi un LEFT JOIN plutôt qu'une vue matérialisée ou une table déjà jointe ?" : Parce qu'on n'a pas touché à la structure de la base (metadata/scores/nutrition restent séparées), donc le JOIN se fait à la demande dans la requête. Une vue permanente dans MotherDuck serait l'étape suivante si les performances devenaient un problème.

## Le plus important à retenir en entrant dans le review

Tu n'as pas besoin de connaître la réponse "parfaite". Pour chaque bout de code, dis simplement : ce que ça fait, pourquoi tu as choisi cette approche à ce moment-là (souvent : cohérence avec le reste du projet, simplicité, temps disponible), et une alternative que tu as considérée ou que tu vois maintenant. C'est exactement ce que la liste ci-dessus te donne pour chaque morceau.
