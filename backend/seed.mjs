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
    TABLE metadata 
    AS SELECT *
    FROM read_parquet('res/product_metadata.parquet')`);

  await connection.run(`
    CREATE or 
    REPLACE 
    TABLE groups 
    AS SELECT *
    FROM read_parquet('res/product_groups.parquet')`);

  await connection.run(`
    CREATE or 
    REPLACE 
    TABLE nutrition 
    AS SELECT *
    FROM read_parquet('res/product_nutrition.parquet')`);
  
  await connection.run(`
    CREATE or 
    REPLACE 
    TABLE scores 
    AS SELECT *
    FROM read_parquet('res/product_scores.parquet')`);
    
  await connection.run(`
    CREATE or 
    REPLACE 
    TABLE variants 
    AS SELECT *
    FROM read_parquet('res/product_variants.parquet')`);

  const check = await connection.runAndReadAll(
    "SELECT count(*) AS total FROM produits",
  );
  const total = check.getRowObjects()[0].total;
  console.log(`nombre de lignes dans la table produit : ${total}`);
} catch (e) {
  console.log("Erreur : " + e.message);
}
