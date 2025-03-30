// controller/asignacionesController.js
const conexion = require('../database/db');

// Función para obtener todas las asignaciones y renderizar la vista
exports.getAll = (req, res) => {
    conexion.query(`
        SELECT 
            asignaciones.id_asignacion,
            asignaciones.estado,
            asignaciones.fecha_asignacion,
            asignaciones.fecha_devolucion,
            asignaciones.razon_asignacion,
            asignaciones.observaciones,
            usuarios.nombre AS nombre_usuario,
            equipos.nombre AS nombre_equipo
        FROM asignaciones
        JOIN usuarios ON asignaciones.usuario_id = usuarios.id_usuario
        JOIN equipos ON asignaciones.equipo_id = equipos.id_equipo
    `, (error, resultados) => {
        if (error) {
            console.error('Error al obtener asignaciones:', error);
            return res.status(500).send('Error en el servidor');
        }
        // Pasar los resultados a la vista
        return res.render('asignaciones/index', { asignaciones: resultados });
    });
    
};

// Función para obtener usuarios y equipos y renderizar la vista de crear asignación
exports.crear = (req, res) => {
    // Obtener usuarios
    conexion.query('SELECT * FROM usuarios', (error, usuarios) => {
        if (error) {
            console.error('Error al obtener usuarios:', error);
            return res.status(500).send('Error en el servidor');
        }

        // Obtener equipos
        conexion.query('SELECT * FROM equipos', (error, equipos) => {
            if (error) {
                console.error('Error al obtener equipos:', error);
                return res.status(500).send('Error en el servidor');
            }

            // Pasar los usuarios y equipos a la vista
            res.render('asignaciones/crear', { usuarios: usuarios, equipos: equipos });
        });
    });
};

// Función para guardar una nueva asignación
exports.save = (req, res) => {
    const { usuario_id, equipo_id, estado, razon_asignacion, observaciones } = req.body;

    if (!usuario_id || !equipo_id) {
        return res.status(400).send('Faltan datos en la solicitud');
    }

    // Si no se proporcionan razón de asignación u observaciones, se puede setear como NULL
    const nuevaAsignacion = {
        usuario_id,
        equipo_id,
        estado,
        razon_asignacion: razon_asignacion || null,
        observaciones: observaciones || null
    };

    conexion.query('INSERT INTO asignaciones SET ?', nuevaAsignacion, (error, resultado) => {
        if (error) {
            console.error('Error al asignar equipo:', error);
            return res.status(500).send('Error en el servidor');
        }
        return res.redirect('/asignaciones');
    });
};

// Función para editar una asignación
exports.edit = (req, res) => {
    const { id } = req.params; // Cambiado de id_asignacion a id

    if (!id) {
        return res.status(400).send('ID no proporcionado');
    }

    const query = `
        SELECT 
            asignaciones.id_asignacion,
            asignaciones.estado,
            asignaciones.fecha_asignacion,
            asignaciones.fecha_devolucion,
            asignaciones.razon_asignacion,
            asignaciones.observaciones,
            asignaciones.usuario_id,
            asignaciones.equipo_id
        FROM asignaciones
        WHERE id_asignacion = ?
    `;

    conexion.query(query, [id], (error, resultado) => {
        if (error) {
            console.error('Error al obtener asignación:', error);
            return res.status(500).send('Error en el servidor');
        }

        if (resultado.length === 0) {
            return res.status(404).send('Asignación no encontrada');
        }

        conexion.query('SELECT * FROM usuarios', (error, usuarios) => {
            if (error) {
                console.error('Error al obtener usuarios:', error);
                return res.status(500).send('Error en el servidor');
            }

            conexion.query('SELECT * FROM equipos', (error, equipos) => {
                if (error) {
                    console.error('Error al obtener equipos:', error);
                    return res.status(500).send('Error en el servidor');
                }

                return res.render('asignaciones/editar', {
                    asignacion: resultado[0],
                    usuarios: usuarios,
                    equipos: equipos
                });
            });
        });
    });
};

exports.update = (req, res) => {
    const { id } = req.params;
    const { usuario_id, equipo_id, estado, fecha_devolucion, razon_asignacion, observaciones } = req.body;

    if (!id) {
        console.error('ID no proporcionado para actualizar');
        return res.status(400).send('ID no proporcionado');
    }

    const actualizacion = {
        usuario_id,
        equipo_id,
        estado,
        fecha_devolucion: fecha_devolucion ? fecha_devolucion : null,
        razon_asignacion: razon_asignacion || null,
        observaciones: observaciones || null
    };

    conexion.query('UPDATE asignaciones SET ? WHERE id_asignacion = ?', [actualizacion, id], (error, resultado) => {
        if (error) {
            console.error('Error al actualizar asignación:', error);
            return res.status(500).send('Error en el servidor');
        }

        if (resultado.affectedRows === 0) {
            console.warn('Ninguna asignación actualizada. ¿ID correcto?');
            return res.status(404).send('Asignación no encontrada');
        }

        console.log('Asignación actualizada con éxito');
        return res.redirect('/asignaciones');
    });
};


// Función para eliminar una asignación
exports.delete = (req, res) => {
    const { id } = req.params;

    // Validar el ID
    if (!id) {
        console.error('ID no proporcionado para eliminar');
        return res.status(400).send('ID no proporcionado');
    }

    conexion.query('DELETE FROM asignaciones WHERE id_asignacion = ?', [id], (error, resultado) => {
        if (error) {
            console.error('Error al eliminar asignación:', error);
            return res.status(500).send('Error en el servidor');
        }

        if (resultado.affectedRows === 0) {
            console.warn('Ninguna asignación eliminada. ¿ID correcto?');
            return res.status(404).send('Asignación no encontrada');
        }

        console.log('Asignación eliminada con éxito');
        return res.redirect('/asignaciones');
    });
};