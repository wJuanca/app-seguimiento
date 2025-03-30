// routes/asignaciones.js
const express = require("express")
const router = express.Router()
const asignacionesController = require("../controllers/asignacionesController")

// Ruta para obtener todas las asignaciones
router.get("/", asignacionesController.getAll) // Cambiado de '/asignaciones' a '/'

// Ruta para crear una nueva asignación
router.get("/crear", asignacionesController.crear) // Cambiado de '/crear-asignacion' a '/crear'

// Ruta para guardar una nueva asignación
router.post("/save", asignacionesController.save) // Cambiado de '/save-asignacion' a '/save'

// Ruta para editar una asignación
router.get("/editar/:id", asignacionesController.edit) // Cambiado de '/editar-asignacion/:id' a '/editar/:id'

// Ruta para actualizar una asignación
router.post("/update/:id", asignacionesController.update) // Cambiado de '/update-asignacion/:id' a '/update/:id'

// Ruta para eliminar una asignación
router.get("/eliminar/:id", asignacionesController.delete) // Cambiado de '/eliminar-asignacion/:id' a '/eliminar/:id'

module.exports = router

