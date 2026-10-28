# EquipeFunnyFoodFacts – OpenFoodFacts CAFR

Application web de consultation de produits alimentaires canadiens.

- **Backend**: Node.js / Express, base de données MotherDuck (DuckDB)
- **Frontend**: Vue 3 + Vite
- **Déploiement local**: Docker et Docker Compose

---

## 1. Prérequis

| Outil | Pourquoi |
|---|---|
| [Git](https://git-scm.com/downloads) | Cloner le dépôt |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Construire et lancer les conteneurs |
| Un token MotherDuck | Accès à la base de données (voir section 3) |

**Windows**: Docker Desktop utilise WSL 2. Laisse l'option cochée pendant l'installation et redémarre l'ordinateur si on te le demande. La **virtualisation** doit aussi être activée dans le BIOS/UEFI de l'ordinateur (voir « Problèmes courants »).

Vérifie ton installation (Docker Desktop doit être **démarré**) :

```bash
docker --version
docker compose version
docker run hello-world
```

Si `hello-world` affiche « Hello from Docker! », tu es prêt.

---

## 2. Installation

```bash
git clone https://github.com/Foungee/EquipeFunnyFoodFacts-OpenFoodFacts-CAFR.git
cd EquipeFunnyFoodFacts-OpenFoodFacts-CAFR
```

---

## 3. Configuration (obligatoire)

Le fichier `backend/.env` contient des secrets. Il n'est **pas** dans le dépôt, tu dois donc le créer toi-même.

1. Copie le modèle :

   ```bash
   # Windows (PowerShell)
   Copy-Item backend/.env.example backend/.env

   # macOS / Linux
   cp backend/.env.example backend/.env
   ```

2. Ouvre `backend/.env` et remplis la valeur :

   ```
   MOTHERDUCK_TOKEN=ton_token_ici
   ```

   - Pas d'espaces autour du `=`.
   - Pas de guillemets autour de la valeur.
   - Pas de ligne vide ou de texte supplémentaire.

3. **Où obtenir le token ?** Contacter EFFF si jamais tu as l'autorisation

---

## 4. Lancer le projet

Depuis la **racine du dépôt** (là où se trouve `docker-compose.yml`) :

```bash
docker compose up --build
```

Au premier lancement, la construction des images prend quelques minutes. Les logs du backend et du frontend s'affichent dans le même terminal.

| Service | Adresse |
|---|---|
| Frontend (site Vue) | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |

Le backend affiche « Server running on port 3000 » quand il est prêt, et `http://localhost:3000` répond « Bienvenue sur mon API ».

### Arrêter le projet

`Ctrl+C` dans le terminal, puis :

```bash
docker compose down
```

### Après avoir modifié du code

Relance avec `docker compose up --build` pour reconstruire les images.

---

## 5. Structure du projet

```
.
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── app.mjs
│   ├── controllers/
│   └── routes/
└── frontend/
    └── EquipeFunnyFoodFacts/
        ├── Dockerfile
        ├── .dockerignore
        └── src/
```

---

## 6. Commandes utiles

| Commande | Effet |
|---|---|
| `docker compose up --build` | Construit et lance tout |
| `docker compose up -d` | Lance en arrière-plan |
| `docker compose logs -f backend` | Suit les logs du backend |
| `docker compose down` | Arrête et supprime les conteneurs |
| `docker ps` | Liste les conteneurs en cours |
