const express = require("express")
const router = express.Router()

// Ruta principal para reparaciones
router.get("/", (req, res) => {
  res.render("reparaciones/index", { reparaciones: [] })
})

// Otras rutas para reparaciones
router.get("/crear", (req, res) => {
  res.render("reparaciones/crear")
})

router.get("/editar/:id", (req, res) => {
  res.render("reparaciones/editar", { reparacion: { id_reparacion: req.params.id } })
})

module.exports = router

