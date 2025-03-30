const conexion = require('../database/db');

exports.saveReparacion = (req, res) => {
    const id_reparacion = req.body.id_reparacion;
    const equipo_id = req.body.equipo_id;
    const usuario_solicitante_id = req.body.usuario_solicitante_id;
    const tecnico_id = req.body.tecnico_id;
    const descripcion_problema = req.body.descripcion_problema;
    const estado = req.body.estado;
    //const fecha_inicio = req.body.fecha_inicio;
    const fecha_finalizacion = req.body.fecha_finalizacion;

    conexion.query("insert into reparaciones set ?",
        { equipo_id: equipo_id, usuario_solicitante_id: usuario_solicitante_id, tecnico_id: tecnico_id, descripcion_problema: descripcion_problema, estado: estado, fecha_finalizacion: fecha_finalizacion}, 
            (error, resultado) => {
                if (error) {
                    console.log(error);
                    return;
                } else {
                    res.redirect('/reparaciones');
                }
        }
    );
};

exports.updateReparacion = (req, res) => {
    const id_reparacion = req.body.id_reparacion || req.query.id_reparacion;
    const { equipo_id, usuario_solicitante_id, tecnico_id, descripcion_problema, estado, fecha_inicio, fecha_finalizacion } = req.body;
    conexion.query('UPDATE reparaciones SET ? WHERE id_reparacion = ?', [{ equipo_id, usuario_solicitante_id, tecnico_id, descripcion_problema, estado, fecha_inicio, fecha_finalizacion }, id_reparacion], 
        (error, resultado) => {
        if (error) {
            console.log(error);
            return;
        } else {
            res.redirect('/reparaciones');
        }
    });
}

exports.deleteReparacion = (req, res) => {
    const id_reparacion = req.body.id_reparacion;
    conexion.query('DELETE from reparaciones WHERE id_reparacion = ?', [id_reparacion], (error, resultado) => {
        if (error) {
            console.log(error);
            return;
        } else {
            res.redirect('/reparaciones');
        }
    });
}

exports.viewReparacion = (req, res) => {
    const id_reparacion = req.params.id_reparacion;
    conexion.query('SELECT * FROM reparaciones WHERE id_reparacion = ?', [id_reparacion], (error, reparacion) => {
        if (error) {
            console.log(error);
            return;
        }
        res.render('reparacion/ver', { reparacion: reparacion[0] });
    });
}

exports.cargarTecnicos = (req, res) => {
    conexion.query('SELECT id_usuario, nombre FROM usuarios WHERE rol = "tecnico"', (error, tecnicos) => {
        if (error) {
            console.log(error);
            return res.render('reparacion/crear', { tecnicos: [] });
        }
        res.render('reparacion/crear', { tecnicos });
    });
};
exports.getReparacionesPorEstado = (req, res) => {
    const estado = req.query.estado;
    const estadosPermitidos = ['pendiente', 'en_proceso', 'reparado', 'descartado'];
    if (!estadosPermitidos.includes(estado)) {
        return res.render('reparacion/index', { reparaciones: [] });
    }
    conexion.query('select * from reparaciones WHERE estado = ?', [estado], (error, resultado) => {
        if (error) {
            console.log(error);
            return;
        } else {
            res.render('reparacion/index', { reparaciones: resultado });
        }
    });
}


