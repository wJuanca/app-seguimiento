const express = require("express");
const router = express.Router();
const conexion = require('./database/db');
const reparacionController = require('./controllers/reparacionController');

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/equipos", (req, res) => {
  res.redirect("/equipos");
});

router.post('/saveReparacion', reparacionController.saveReparacion);
router.post('/editReparacion', reparacionController.updateReparacion);
router.post('/deleteReparacion', reparacionController.deleteReparacion);
router.post('/viewReparacion', reparacionController.viewReparacion);
router.get('/', (req, res) => {
  res.render('index');
});
// cargar
router.get('/reparaciones', (req, res) => {
  conexion.query('select * from reparaciones', (error, resultado) => {
     if (error) {
      console.log(error);
      return;
     }
     else {
      res.render('reparacion/index', {reparaciones: resultado});
     }
  })
})
// editar
router.get('/editarReparacion/:id', (req, res) => {
  const id_reparacion = req.params.id;
  conexion.query('select * from reparaciones where id_reparacion = ?', [id_reparacion], (error, resultado) => {
      if (error) {
          console.log(error);
          return;
      }
      else{
          const estados = ['pendiente', 'en_proceso', 'reparado', 'descartado'];
          res.render('reparacion/editar', { reparacion: resultado[0], estados: estados });

      }
  });
});
// eliminqq
router.get('/eliminarReparacion/:id', (req, res) => {
  const id_reparacion = req.params.id;
  conexion.query('select * from reparaciones where id_reparacion = ?', [id_reparacion], (error, resultado) => {
      if (error) {
          console.log(error);
          return;
      } else {
          res.render('reparacion/eliminar', { reparacion: resultado[0] });
      }
  });
})
// vwer
router.get('/verReparacion/:id', (req, res) => {
  const id_reparacion = req.params.id;
  conexion.query('select * from reparaciones where id_reparacion = ?', [id_reparacion], (error, resultado) => {
      if (error) {
          console.log(error);
          return;
      } else {
          res.render('reparacion/ver', { reparacion: resultado[0] });
      }
  });
})
router.get('/reparaciones/estado', reparacionController.getReparacionesPorEstado);
router.get('/crearReparacion', reparacionController.cargarTecnicos);

module.exports = router;

