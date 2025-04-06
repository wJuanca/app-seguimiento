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

// Temporarily comment out this route until we properly implement the controller method
// router.get("/historial", auth.verificarUsuario, miEquipoController.mostrarHistorial);

module.exports = router

