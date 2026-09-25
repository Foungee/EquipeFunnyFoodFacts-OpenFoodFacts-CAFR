import { DuckDBInstance } from "@duckdb/node-api";
import dotenv from "dotenv";
dotenv.config();

try {
  const instanceMotheDuck = await DuckDBInstance.create("md:my_db", {
    motherduck_token: process.env.MOTHERDUCK_TOKEN,
  });
  const connection = await instanceMotheDuck.connect();

  console.log("MotherDuck Connecté");

  await connection.run(`
    CREATE or 
    REPLACE 
    TABLE produits 
    AS SELECT * 
    FROM read_parquet('https://huggingface.co/datasets/offCanada/openfoodfacts-canada/resolve/main/openfoodfacts_canada.parquet')`);

  const check = await connection.runAndReadAll(
    "SELECT count(*) AS total FROM produits",
  );
  const total = check.getRowObjects()[0].total;
  console.log(`nombre de lignes dans la table produit : ${total}`);
} catch (e) {
  console.log("Erreur : " + e.message);
}
