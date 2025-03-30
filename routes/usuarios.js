//Este archivo es las ruetas de la app y hacer las llamadas

const express = require("express");
const router = express.Router();
const conexion = require("../database/db");
const usuariosController = require("../controllers/usuarios");

// RUTAS PARA usuarios

// Ruta principal - lista de empleados
router.get("/usuarios", (req, res) => {
  conexion.query("SELECT * FROM usuarios", (error, resultado) => {
    if (error) {
      console.log(error);
      return;
    }
    res.render("usuarios/index", { usuarios: resultado });
  });
});

// Ruta para mostrar el formulario de crear empleado
router.get("/crear-usuarios", (req, res) => {
  res.render("usuarios/crear");
});

// Ruta para guardar un nuevo empleado
router.post("/save-usuarios", usuariosController.save);

// Ruta para mostrar el formulario de editar empleado
router.get("/editar-usuarios/:id", (req, res) => {
  const id_usuario = req.params.id;
  conexion.query(
    "SELECT * FROM usuarios WHERE id_usuario = ?",
    [id_usuario],
    (error, resultado) => {
      if (error) {
        console.log(error);
        return;
      }
      res.render("usuarios/editar", { usuarios: resultado[0] });
    }
  );
});

// Ruta para actualizar empleado
router.post("/edit-usuarios", usuariosController.edit);

// Ruta para mostrar detalles de empleado
router.get("/ver-usuarios/:id", (req, res) => {
  const id_usuario = req.params.id;
  conexion.query(
    "SELECT * FROM usuarios WHERE id_usuario = ?",
    [id_usuario],
    (error, resultado) => {
      if (error) {
        console.log(error);
        return;
      }
      res.render("usuarios/ver", { usuarios: resultado[0] });
    }
  );
});

// Ruta para mostrar el formulario de eliminar empleado
router.get("/eliminar-usuarios/:id", (req, res) => {
  const id_usuario = req.params.id;
  conexion.query(
    "SELECT * FROM usuarios WHERE id_usuario = ?",
    [id_usuario],
    (error, resultado) => {
      if (error) {
        console.log(error);
        return;
      }
      res.render("usuarios/eliminar", { usuarios: resultado[0] });
    }
  );
});

// Ruta para eliminar empleado
router.post("/eliminar-usuarios", usuariosController.eliminar);

module.exports = router;

