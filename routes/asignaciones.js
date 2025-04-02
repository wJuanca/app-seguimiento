// routes/asignaciones.js
const express = require("express")
const router = express.Router()
const asignacionesController = require("../controllers/asignacionesController")

// Ruta para obtener todas las asignaciones
router.get("/", asignacionesController.mostrarAsignaciones)

// Ruta para crear una nueva asignación
router.get("/crear", asignacionesController.formCrearAsignacion)

// Ruta para guardar una nueva asignación
router.post("/save", asignacionesController.crearAsignacion)

// Ruta para editar una asignación
router.get("/editar/:id", asignacionesController.formEditarAsignacion)

// Ruta para actualizar una asignación
router.post("/update/:id", asignacionesController.actualizarAsignacion)

// Ruta para eliminar una asignación
router.get("/eliminar/:id", asignacionesController.eliminarAsignacion)

module.exports = router

