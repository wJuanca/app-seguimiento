const express = require("express");
const router = express.Router();

// Importar otras rutas
const equiposRoutes = require("./equipos");

router.use("/equipos", equiposRoutes);

// Ruta principal
router.get("/", (req, res) => {
  res.render("index");
});

module.exports = router;

