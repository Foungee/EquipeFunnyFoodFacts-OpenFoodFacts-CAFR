import express from "express";
import pool from "./controllers/dbController.mjs";

const app = express();
const c = await pool.connect();
console.log((await c.query("SELECT current_database(), version()")).rows);
c.release();

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bienvenue sur mon API" });
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Erreur interne du serveur",
    error: err.name,
    path: req.originalUrl,
    timestamp: new Date(),
    status: err.statusCode || 500,
  });
});

export default app;
