const express = require("express")
const router = express.Router()
const miEquipoController = require("../controllers/mi-equipo")

// Rutas para la vista de "Mi Equipo" (usuario final)
router.get("/", miEquipoController.mostrarMisEquipos)
router.get("/detalles/:id", miEquipoController.verDetallesEquipo)

module.exports = router

