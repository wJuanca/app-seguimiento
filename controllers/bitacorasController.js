const conexion = require("../database/db")
const conexionPromise = conexion.promise

// Función para registrar eventos en la bitácora (versión con promesas)
exports.registrarEvento = async (
  tipo_evento,
  id_referencia,
  tabla_referencia,
  descripcion,
  usuario_id,
  detalles = {},
) => {
  try {
    const query = `
      INSERT INTO bitacoras 
      (tipo_evento, id_referencia, tabla_referencia, descripcion, usuario_id, detalles) 
      VALUES (?, ?, ?, ?, ?, ?)
    `

    await conexionPromise.query(query, [
      tipo_evento,
      id_referencia,
      tabla_referencia,
      descripcion,
      usuario_id || null,
      JSON.stringify(detalles),
    ])

    console.log("Evento registrado en bitácora:", descripcion)
    return true
  } catch (error) {
    console.error("Error al registrar evento en bitácora:", error)
    return false
  }
}

// Mostrar todas las bitácoras con paginación
exports.mostrarBitacoras = (req, res) => {
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 20
  const offset = (page - 1) * limit

  // Filtros
  const tipoEvento = req.query.tipo || ""
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""
  const usuarioId = req.query.usuario || ""

  let whereClause = "1=1"
  const params = []

  if (tipoEvento) {
    whereClause += " AND b.tipo_evento = ?"
    params.push(tipoEvento)
  }

  if (fechaInicio) {
    whereClause += " AND DATE(b.fecha_registro) >= ?"
    params.push(fechaInicio)
  }

  if (fechaFin) {
    whereClause += " AND DATE(b.fecha_registro) <= ?"
    params.push(fechaFin)
  }

  if (usuarioId) {
    whereClause += " AND b.usuario_id = ?"
    params.push(usuarioId)
  }

  // Consulta principal con JOIN para obtener nombres de usuarios
  const query = `
    SELECT b.*, u.nombre AS nombre_usuario
    FROM bitacoras b
    LEFT JOIN usuarios u ON b.usuario_id = u.id_usuario
    WHERE ${whereClause}
    ORDER BY b.fecha_registro DESC
    LIMIT ? OFFSET ?
  `

  // Consulta para contar el total de registros (para paginación)
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM bitacoras b
    WHERE ${whereClause}
  `

  // Consulta para obtener usuarios (para el filtro)
  const usuariosQuery = `
    SELECT id_usuario, nombre
    FROM usuarios
    ORDER BY nombre
  `

  // Ejecutar consultas
  conexion.query(countQuery, params, (errorCount, resultCount) => {
    if (errorCount) {
      console.error("Error al contar bitácoras:", errorCount)
      req.flash("error", "Error al cargar las bitácoras")
      return res.redirect("/")
    }

    const totalRegistros = resultCount[0].total
    const totalPaginas = Math.ceil(totalRegistros / limit)

    // Agregar parámetros de paginación
    const queryParams = [...params, limit, offset]

    conexion.query(query, queryParams, (error, bitacoras) => {
      if (error) {
        console.error("Error al obtener bitácoras:", error)
        req.flash("error", "Error al cargar las bitácoras")
        return res.redirect("/")
      }

      conexion.query(usuariosQuery, (errorUsuarios, usuarios) => {
        if (errorUsuarios) {
          console.error("Error al obtener usuarios:", errorUsuarios)
        }

        res.render("bitacoras/index", {
          bitacoras,
          paginacion: {
            pagina: page,
            totalPaginas,
            totalRegistros,
            limite: limit,
          },
          filtros: {
            tipoEvento,
            fechaInicio,
            fechaFin,
            usuarioId,
          },
          usuarios: usuarios || [],
        })
      })
    })
  })
}

// Mostrar bitácoras de reparaciones
exports.bitacorasReparaciones = (req, res) => {
  const page = Number.parseInt(req.query.page) || 1
  const limit = Number.parseInt(req.query.limit) || 20
  const offset = (page - 1) * limit

  // Filtros
  const equipoId = req.query.equipo || ""
  const tecnicoId = req.query.tecnico || ""
  const estado = req.query.estado || ""
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""

  let whereClause = 'b.tipo_evento = "reparacion"'
  const params = []

  if (equipoId) {
    whereClause += " AND r.equipo_id = ?"
    params.push(equipoId)
  }

  if (tecnicoId) {
    whereClause += " AND r.tecnico_id = ?"
    params.push(tecnicoId)
  }

  if (estado) {
    whereClause += " AND r.estado = ?"
    params.push(estado)
  }

  if (fechaInicio) {
    whereClause += " AND DATE(b.fecha_registro) >= ?"
    params.push(fechaInicio)
  }

  if (fechaFin) {
    whereClause += " AND DATE(b.fecha_registro) <= ?"
    params.push(fechaFin)
  }

  // Consulta principal
  const query = `
    SELECT b.*, 
           r.descripcion_problema, r.estado AS estado_reparacion,
           e.nombre AS nombre_equipo, e.marca, e.modelo,
           t.nombre AS nombre_tecnico,
           u.nombre AS nombre_usuario
    FROM bitacoras b
    LEFT JOIN reparaciones r ON b.id_referencia = r.id_reparacion AND b.tabla_referencia = 'reparaciones'
    LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
    LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
    LEFT JOIN usuarios u ON b.usuario_id = u.id_usuario
    WHERE ${whereClause}
    ORDER BY b.fecha_registro DESC
    LIMIT ? OFFSET ?
  `

  // Consulta para contar
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM bitacoras b
    LEFT JOIN reparaciones r ON b.id_referencia = r.id_reparacion AND b.tabla_referencia = 'reparaciones'
    WHERE ${whereClause}
  `

  // Consultas para filtros
  const equiposQuery = `
    SELECT id_equipo, nombre, marca, modelo
    FROM equipos
    ORDER BY nombre
  `

  const tecnicosQuery = `
    SELECT id_usuario, nombre
    FROM usuarios
    WHERE rol = 'tecnico'
    ORDER BY nombre
  `

  // Ejecutar consultas
  conexion.query(countQuery, params, (errorCount, resultCount) => {
    if (errorCount) {
      console.error("Error al contar bitácoras de reparaciones:", errorCount)
      req.flash("error", "Error al cargar las bitácoras")
      return res.redirect("/bitacoras")
    }

    const totalRegistros = resultCount[0].total
    const totalPaginas = Math.ceil(totalRegistros / limit)

    // Agregar parámetros de paginación
    const queryParams = [...params, limit, offset]

    conexion.query(query, queryParams, (error, bitacoras) => {
      if (error) {
        console.error("Error al obtener bitácoras de reparaciones:", error)
        req.flash("error", "Error al cargar las bitácoras")
        return res.redirect("/bitacoras")
      }

      // Obtener equipos para filtro
      conexion.query(equiposQuery, (errorEquipos, equipos) => {
        // Obtener técnicos para filtro
        conexion.query(tecnicosQuery, (errorTecnicos, tecnicos) => {
          res.render("bitacoras/reparaciones", {
            bitacoras,
            paginacion: {
              pagina: page,
              totalPaginas,
              totalRegistros,
              limite: limit,
            },
            filtros: {
              equipoId,
              tecnicoId,
              estado,
              fechaInicio,
              fechaFin,
            },
            equipos: equipos || [],
            tecnicos: tecnicos || [],
            estados: ["pendiente", "en_proceso", "reparado", "descartado"],
          })
        })
      })
    })
  })
}

// Mostrar bitácoras por técnico
exports.bitacorasPorTecnico = (req, res) => {
  const tecnicoId = req.params.id

  // Verificar que el técnico existe
  conexion.query(
    'SELECT * FROM usuarios WHERE id_usuario = ? AND rol = "tecnico"',
    [tecnicoId],
    (error, resultados) => {
      if (error || resultados.length === 0) {
        req.flash("error", "Técnico no encontrado")
        return res.redirect("/bitacoras/tecnicos")
      }

      const tecnico = resultados[0]

      // Obtener bitácoras de reparaciones del técnico
      const query = `
      SELECT b.*, 
             r.descripcion_problema, r.estado AS estado_reparacion, r.fecha_inicio, r.fecha_finalizacion,
             e.nombre AS nombre_equipo, e.marca, e.modelo,
             JSON_EXTRACT(b.detalles, '$.cambios') AS cambios
      FROM bitacoras b
      LEFT JOIN reparaciones r ON b.id_referencia = r.id_reparacion AND b.tabla_referencia = 'reparaciones'
      LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
      WHERE b.tipo_evento = 'reparacion' 
      AND r.tecnico_id = ?
      ORDER BY b.fecha_registro DESC
    `

      // Estadísticas del técnico
      const statsQuery = `
      SELECT 
        COUNT(*) AS total_reparaciones,
        SUM(CASE WHEN r.estado = 'reparado' THEN 1 ELSE 0 END) AS reparaciones_completadas,
        SUM(CASE WHEN r.estado = 'en_proceso' THEN 1 ELSE 0 END) AS reparaciones_en_proceso,
        SUM(CASE WHEN r.estado = 'descartado' THEN 1 ELSE 0 END) AS reparaciones_descartadas,
        AVG(TIMESTAMPDIFF(DAY, r.fecha_inicio, r.fecha_finalizacion)) AS promedio_dias
      FROM reparaciones r
      WHERE r.tecnico_id = ? AND r.fecha_finalizacion IS NOT NULL
    `

      conexion.query(query, [tecnicoId], (errorBitacoras, bitacoras) => {
        if (errorBitacoras) {
          console.error("Error al obtener bitácoras del técnico:", errorBitacoras)
          req.flash("error", "Error al cargar las bitácoras del técnico")
          return res.redirect("/bitacoras/tecnicos")
        }

        conexion.query(statsQuery, [tecnicoId], (errorStats, stats) => {
          res.render("bitacoras/tecnico", {
            tecnico,
            bitacoras,
            estadisticas: stats && stats.length > 0 ? stats[0] : null,
          })
        })
      })
    },
  )
}

// Listar técnicos con estadísticas
exports.listarTecnicos = (req, res) => {
  const query = `
    SELECT 
      u.id_usuario, u.nombre, u.correo,
      COUNT(r.id_reparacion) AS total_reparaciones,
      SUM(CASE WHEN r.estado = 'reparado' THEN 1 ELSE 0 END) AS reparaciones_completadas,
      SUM(CASE WHEN r.estado = 'en_proceso' THEN 1 ELSE 0 END) AS reparaciones_en_proceso,
      AVG(TIMESTAMPDIFF(DAY, r.fecha_inicio, r.fecha_finalizacion)) AS promedio_dias
    FROM usuarios u
    LEFT JOIN reparaciones r ON u.id_usuario = r.tecnico_id
    WHERE u.rol = 'tecnico'
    GROUP BY u.id_usuario
    ORDER BY total_reparaciones DESC
  `

  conexion.query(query, (error, tecnicos) => {
    if (error) {
      console.error("Error al obtener técnicos:", error)
      req.flash("error", "Error al cargar los técnicos")
      return res.redirect("/bitacoras")
    }

    res.render("bitacoras/tecnicos", { tecnicos })
  })
}

// Mostrar bitácoras por equipo
exports.bitacorasPorEquipo = (req, res) => {
  const equipoId = req.params.id

  // Verificar que el equipo existe
  conexion.query("SELECT * FROM equipos WHERE id_equipo = ?", [equipoId], (error, resultados) => {
    if (error || resultados.length === 0) {
      req.flash("error", "Equipo no encontrado")
      return res.redirect("/bitacoras/equipos")
    }

    const equipo = resultados[0]

    // Obtener bitácoras del equipo
    const query = `
      SELECT b.*, 
             r.descripcion_problema, r.estado AS estado_reparacion, 
             r.fecha_inicio, r.fecha_finalizacion, r.solucion_aplicada,
             t.nombre AS nombre_tecnico,
             JSON_EXTRACT(b.detalles, '$.cambios') AS cambios
      FROM bitacoras b
      LEFT JOIN reparaciones r ON b.id_referencia = r.id_reparacion AND b.tabla_referencia = 'reparaciones'
      LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
      WHERE (b.tipo_evento = 'reparacion' AND r.equipo_id = ?)
         OR (b.tipo_evento = 'equipo' AND b.id_referencia = ? AND b.tabla_referencia = 'equipos')
      ORDER BY b.fecha_registro DESC
    `

    // Estadísticas del equipo
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_reparaciones,
        SUM(CASE WHEN r.estado = 'reparado' THEN 1 ELSE 0 END) AS reparaciones_completadas,
        SUM(CASE WHEN r.estado = 'descartado' THEN 1 ELSE 0 END) AS reparaciones_descartadas,
        MAX(r.fecha_inicio) AS ultima_reparacion
      FROM reparaciones r
      WHERE r.equipo_id = ?
    `

    // Obtener usuario actual asignado
    const usuarioQuery = `
      SELECT u.nombre, u.correo
      FROM usuarios u
      JOIN equipos e ON u.id_usuario = e.usuario_actual_id
      WHERE e.id_equipo = ?
    `

    conexion.query(query, [equipoId, equipoId], (errorBitacoras, bitacoras) => {
      if (errorBitacoras) {
        console.error("Error al obtener bitácoras del equipo:", errorBitacoras)
        req.flash("error", "Error al cargar las bitácoras del equipo")
        return res.redirect("/bitacoras/equipos")
      }

      conexion.query(statsQuery, [equipoId], (errorStats, stats) => {
        conexion.query(usuarioQuery, [equipoId], (errorUsuario, usuario) => {
          res.render("bitacoras/equipo", {
            equipo,
            bitacoras,
            estadisticas: stats && stats.length > 0 ? stats[0] : null,
            usuario: usuario && usuario.length > 0 ? usuario[0] : null,
          })
        })
      })
    })
  })
}

// Listar equipos con estadísticas
exports.listarEquipos = (req, res) => {
  const query = `
    SELECT 
      e.id_equipo, e.nombre, e.marca, e.modelo, e.tipo, e.estado,
      COUNT(r.id_reparacion) AS total_reparaciones,
      SUM(CASE WHEN r.estado = 'reparado' THEN 1 ELSE 0 END) AS reparaciones_completadas,
      MAX(r.fecha_inicio) AS ultima_reparacion
    FROM equipos e
    LEFT JOIN reparaciones r ON e.id_equipo = r.equipo_id
    GROUP BY e.id_equipo
    ORDER BY total_reparaciones DESC
  `

  conexion.query(query, (error, equipos) => {
    if (error) {
      console.error("Error al obtener equipos:", error)
      req.flash("error", "Error al cargar los equipos")
      return res.redirect("/bitacoras")
    }

    res.render("bitacoras/equipos", { equipos })
  })
}

// Generar reporte PDF
exports.generarReportePDF = (req, res) => {
  const tipo = req.query.tipo || "general"
  const id = req.query.id || null

  // Dependiendo del tipo, generamos diferentes reportes
  let query = ""
  let params = []
  let titulo = ""

  switch (tipo) {
    case "tecnico":
      if (!id) {
        req.flash("error", "ID de técnico no proporcionado")
        return res.redirect("/bitacoras/tecnicos")
      }

      query = `
        SELECT 
          u.id_usuario, u.nombre, u.correo,
          r.id_reparacion, r.descripcion_problema, r.estado, 
          r.fecha_inicio, r.fecha_finalizacion, r.solucion_aplicada,
          e.nombre AS nombre_equipo, e.marca, e.modelo
        FROM usuarios u
        LEFT JOIN reparaciones r ON u.id_usuario = r.tecnico_id
        LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
        WHERE u.id_usuario = ? AND u.rol = 'tecnico'
        ORDER BY r.fecha_inicio DESC
      `

      params = [id]
      titulo = "Reporte de Actividades del Técnico"
      break

    case "equipo":
      if (!id) {
        req.flash("error", "ID de equipo no proporcionado")
        return res.redirect("/bitacoras/equipos")
      }

      query = `
        SELECT 
          e.id_equipo, e.nombre, e.marca, e.modelo, e.tipo, e.numero_serie, e.estado,
          r.id_reparacion, r.descripcion_problema, r.estado AS estado_reparacion, 
          r.fecha_inicio, r.fecha_finalizacion, r.solucion_aplicada,
          t.nombre AS nombre_tecnico
        FROM equipos e
        LEFT JOIN reparaciones r ON e.id_equipo = r.equipo_id
        LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
        WHERE e.id_equipo = ?
        ORDER BY r.fecha_inicio DESC
      `

      params = [id]
      titulo = "Historial de Reparaciones del Equipo"
      break

    case "reparaciones":
      // Filtros opcionales
      const estado = req.query.estado || ""
      const fechaInicio = req.query.fechaInicio || ""
      const fechaFin = req.query.fechaFin || ""

      query = `
        SELECT 
          r.id_reparacion, r.descripcion_problema, r.estado, 
          r.fecha_inicio, r.fecha_finalizacion, r.solucion_aplicada,
          e.nombre AS nombre_equipo, e.marca, e.modelo,
          t.nombre AS nombre_tecnico,
          u.nombre AS nombre_solicitante
        FROM reparaciones r
        LEFT JOIN equipos e ON r.equipo_id = e.id_equipo
        LEFT JOIN usuarios t ON r.tecnico_id = t.id_usuario
        LEFT JOIN usuarios u ON r.usuario_solicitante_id = u.id_usuario
        WHERE 1=1
      `

      if (estado) {
        query += " AND r.estado = ?"
        params.push(estado)
      }

      if (fechaInicio) {
        query += " AND DATE(r.fecha_inicio) >= ?"
        params.push(fechaInicio)
      }

      if (fechaFin) {
        query += " AND DATE(r.fecha_inicio) <= ?"
        params.push(fechaFin)
      }

      query += " ORDER BY r.fecha_inicio DESC"
      titulo = "Reporte de Reparaciones"
      break

    default:
      query = `
        SELECT 
          b.id_bitacora, b.tipo_evento, b.descripcion, b.fecha_registro,
          u.nombre AS nombre_usuario
        FROM bitacoras b
        LEFT JOIN usuarios u ON b.usuario_id = u.id_usuario
        ORDER BY b.fecha_registro DESC
        LIMIT 500
      `

      titulo = "Registro General de Actividades"
  }

  // Ejecutar la consulta
  conexion.query(query, params, (error, resultados) => {
    if (error) {
      console.error("Error al generar reporte:", error)
      req.flash("error", "Error al generar el reporte")
      return res.redirect("/bitacoras")
    }

    // Aquí normalmente generaríamos el PDF
    // Como es un ejemplo, simplemente mostraremos los datos en formato JSON
    res.render("bitacoras/reporte", {
      titulo,
      tipo,
      datos: resultados,
      filtros: req.query,
    })
  })
}

