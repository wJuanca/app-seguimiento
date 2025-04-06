const express = require("express")
const router = express.Router()
const equipoController = require("../controllers/equipos")
const authMiddleware = require("../middlewares/auth")

// mostrar todos los equipos
router.get("/", equipoController.mostrarEquipos)

// ver detalles de un equipo (solo lectura)
router.get("/ver/:id", equipoController.verEquipo)

// formulario para crear un nuevo equipo (solo admin)
router.get("/crear", authMiddleware.verificarRol(["admin"]), equipoController.formCrearEquipo)
router.post("/crear", authMiddleware.verificarRol(["admin"]), equipoController.crearEquipo)

// formulario para editar un equipo (solo admin)
router.get("/editar/:id", authMiddleware.verificarRol(["admin"]), equipoController.formEditarEquipo)
router.post("/editar/:id", authMiddleware.verificarRol(["admin"]), equipoController.editarEquipo)

// eliminar un equipo (solo admin)
router.get("/eliminar/:id", authMiddleware.verificarRol(["admin"]), equipoController.eliminarEquipo)

module.exports = router

