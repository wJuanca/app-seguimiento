const express = require("express");
const router = express.Router();
const equipoController = require("../controllers/equipos");

// mostrar todos los equipos
router.get("/", equipoController.mostrarEquipos);

// formulario para crear un nuevo equipo
router.get("/crear", equipoController.formCrearEquipo);
router.post("/crear", equipoController.crearEquipo);

// formulario para editar un equipo
router.get("/editar/:id", equipoController.formEditarEquipo);
router.post("/editar/:id", equipoController.editarEquipo);

// eliminar un equip
router.get("/eliminar/:id", equipoController.eliminarEquipo);


module.exports = router;

