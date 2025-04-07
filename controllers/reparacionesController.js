const db = require("../database/db")
const { promisify } = require("util")

// Convertir query a promesa
const queryAsync = promisify(db.query).bind(db)

// Controlador para la página principal de reparaciones
exports.mostrarReparaciones = async (req, res) => {
  try {
    const reparaciones = await queryAsync(`
            SELECT r.*, e.nombre as equipo_nombre, e.marca, e.modelo, 
                   u.nombre as usuario_nombre, t.nombre as tecnico_nombre
            FROM reparaciones r
            LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
            LEFT JOIN usuarios u ON r.usuario_solicitante_id = u.id_usuario
            LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
            ORDER BY r.fecha_solicitud DESC
        `)

    res.render("reparaciones/index", {
      reparaciones,
      usuario: req.session.usuario,
      mensajes: req.flash(),
    })
  } catch (error) {
    console.error("Error al obtener reparaciones:", error)
    req.flash("error", "Error al cargar las reparaciones")
    res.redirect("/")
  }
}

// Controlador para mostrar el formulario de creación
exports.mostrarFormularioCrear = async (req, res) => {
  try {
    // Obtener solo equipos asignados a usuarios finales
    const equipos = await queryAsync(`
            SELECT e.*, u.id_usuario as usuario_actual_id, u.nombre as usuario_nombre
            FROM equipos e
            INNER JOIN asignaciones a ON e.id_equipo = a.equipo_id
            INNER JOIN usuarios u ON a.usuario_id = u.id_usuario
            WHERE a.fecha_fin IS NULL
            AND u.rol = 'usuario_final'
            ORDER BY e.nombre
        `)

    // Obtener técnicos
    const tecnicos = await queryAsync(`
            SELECT id_usuario, nombre
            FROM usuarios
            WHERE rol = 'tecnico'
            ORDER BY nombre
        `)

    res.render("reparaciones/crear", {
      equipos,
      tecnicos,
      usuario: req.session.usuario,
      mensajes: req.flash(),
    })
  } catch (error) {
    console.error("Error al cargar formulario de creación:", error)
    req.flash("error", "Error al cargar el formulario")
    res.redirect("/reparaciones")
  }
}

// Controlador para procesar la creación de una reparación
exports.crearReparacion = async (req, res) => {
  const { equipo_id, usuario_solicitante_id, tecnico_id, estado, descripcion_problema } = req.body

  try {
    // Insertar la nueva reparación
    const resultado = await queryAsync(
      `
            INSERT INTO reparaciones 
            (equipo_id, usuario_solicitante_id, tecnico_id, estado, descripcion_problema, fecha_solicitud)
            VALUES (?, ?, ?, ?, ?, NOW())
        `,
      [equipo_id, usuario_solicitante_id, tecnico_id, estado, descripcion_problema],
    )

    // Registrar en bitácora
    await queryAsync(
      `
            INSERT INTO bitacoras 
            (tipo_evento, id_referencia, descripcion, usuario_id, fecha_registro)
            VALUES ('reparacion', ?, ?, ?, NOW())
        `,
      [
        resultado.insertId,
        `Nueva solicitud de reparación creada para el equipo ID: ${equipo_id}`,
        req.session.usuario.id_usuario,
      ],
    )

    req.flash("success", "Reparación creada exitosamente")
    res.redirect("/reparaciones")
  } catch (error) {
    console.error("Error al crear reparación:", error)
    req.flash("error", "Error al crear la reparación")
    res.redirect("/reparaciones/crear")
  }
}

// Resto de controladores para ver, editar, eliminar, etc.

