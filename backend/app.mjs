import express from "express";
import produitsRoutes from "./routes/produits.mjs";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use("/produits", produitsRoutes);

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