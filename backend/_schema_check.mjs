import { query } from './controllers/dbController.mjs';

try {
  const rows = await query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'main'
      AND table_name IN ('metadata','scores','nutrition','groups','produits','variants')
    ORDER BY table_name, ordinal_position
  `);
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.log('ERREUR: ' + e.message);
}
process.exit(0);
