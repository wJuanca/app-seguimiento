const express = require("express")
const router = express.Router()
const miEquipoController = require("../controllers/mi-equipo")
const auth = require("../middlewares/auth") // Corrected path to the auth middleware

// Rutas para la vista de "Mi Equipo" (usuario final)
router.get("/", miEquipoController.mostrarMisEquipos)
router.get("/detalles/:id", miEquipoController.verDetallesEquipo)

// Nuevas rutas para devolver equipo y reportar para reparación
router.post("/devolver/:id", miEquipoController.devolverEquipo)
router.post("/reportar/:id", miEquipoController.reportarParaReparacion)

// Ruta para ver el historial completo
router.get("/historial", miEquipoController.mostrarHistorial)

module.exports = router

