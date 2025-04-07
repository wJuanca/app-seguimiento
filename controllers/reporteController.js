const conexion = require("../database/db")


//Contralador para los reportes
exports.mostrarReporteInventario = (req, res) => {
  const queries = {
    equipos: `
          SELECT e.*, u.nombre as usuario_nombre 
          FROM equipos e 
          LEFT JOIN usuarios u ON e.usuario_actual_id = u.id_usuario
      `,
    resumen: `
          SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
              SUM(CASE WHEN estado = 'en_reparacion' THEN 1 ELSE 0 END) as en_reparacion,
              SUM(CASE WHEN estado = 'dado_de_baja' THEN 1 ELSE 0 END) as dados_de_baja
          FROM equipos
      `,
    tiposEquipo: `
          SELECT tipo, COUNT(*) as cantidad 
          FROM equipos 
          GROUP BY tipo
      `,
    estadosEquipo: `
          SELECT estado, COUNT(*) as cantidad 
          FROM equipos 
          GROUP BY estado
      `,
    ultimasActualizaciones: `
          SELECT 
              e.nombre,
              e.tipo,
              e.estado,
              b.tipo_evento AS tipo_cambio,
              b.descripcion AS ultimo_cambio,
              b.fecha_registro AS ultima_actualizacion,
              u.nombre AS usuario_responsable,
              u.rol AS rol_usuario
          FROM equipos e
          LEFT JOIN bitacoras b ON e.id_equipo = b.id_referencia
          LEFT JOIN usuarios u ON b.usuario_id = u.id_usuario
          WHERE b.fecha_registro = (
              SELECT MAX(fecha_registro) 
              FROM bitacoras 
              WHERE id_referencia = e.id_equipo
          )
          ORDER BY b.fecha_registro DESC
          LIMIT 10
      `,
    usuarios: `
          SELECT id_usuario, nombre 
          FROM usuarios 
          WHERE rol = 'usuario_final'
          ORDER BY nombre
      `,
  }

  // Ejecutar las consultas de forma paralela
  // y esperar a que todas se completen
  Promise.all([
    queryPromise(queries.equipos),
    queryPromise(queries.resumen),
    queryPromise(queries.tiposEquipo),
    queryPromise(queries.estadosEquipo),
    queryPromise(queries.ultimasActualizaciones),
    queryPromise(queries.usuarios),
  ])
    .then(([equipos, [resumen], tiposEquipo, estadosEquipo, ultimasActualizaciones, usuarios]) => {
      res.render("reports/reporte_inventario", {
        title: req.title || "Inventario",
        page: req.page || "inventario",
        currentPath: req.currentPath || "/reportes/reporte_inventario",
        equipos,
        resumen,
        tiposEquipo,
        estadosEquipo,
        ultimasActualizaciones,
        usuarios,
      })
    })
    .catch((error) => {
      console.error("Error:", error)
      res.status(500).send("Error en el servidor")
    })
}

function queryPromise(sql) {
  return new Promise((resolve, reject) => {
    conexion.query(sql, (error, results) => {
      if (error) reject(error)
      resolve(results)
    })
  })
}

// Controlador para mostrar el reporte de asignaciones
exports.mostrarReporteAsignaciones = (req, res) => {
  const queries = {
    distribucionEquipos: `
          SELECT u.nombre, COUNT(e.id_equipo) as total_equipos
          FROM usuarios u
          LEFT JOIN equipos e ON u.id_usuario = e.usuario_actual_id
          WHERE u.rol = 'usuario_final'
          GROUP BY u.id_usuario
      `,
    totalEquipos: `
          SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN estado = 'asignado' THEN 1 ELSE 0 END) as asignados,
              SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles
          FROM equipos
      `,
    usuariosTopEquipos: `
          SELECT u.nombre, COUNT(e.id_equipo) as total_equipos
          FROM usuarios u
          LEFT JOIN equipos e ON u.id_usuario = e.usuario_actual_id
          GROUP BY u.id_usuario
          HAVING total_equipos > 0
          ORDER BY total_equipos DESC
          LIMIT 5
      `,
    historialAsignaciones: `
          SELECT 
              a.fecha_asignacion,
              u.nombre as usuario,
              e.nombre as equipo,
              e.marca,
              e.modelo,
              a.estado,
              t.nombre as tecnico
          FROM asignaciones a
          JOIN usuarios u ON a.usuario_id = u.id_usuario
          JOIN equipos e ON a.equipo_id = e.id_equipo
          LEFT JOIN usuarios t ON a.usuario_id = t.id_usuario
          ORDER BY a.fecha_asignacion DESC
          LIMIT 15
      `,
    listaAsignaciones: `
  SELECT 
      a.id_asignacion,
      a.fecha_asignacion,
      a.fecha_devolucion,
      a.estado,
      u.nombre as usuario,
      e.nombre as equipo,
      e.marca,
      e.modelo,
      e.tipo as tipo_equipo,
      t.nombre as tecnico
  FROM asignaciones a
  JOIN usuarios u ON a.usuario_id = u.id_usuario
  JOIN equipos e ON a.equipo_id = e.id_equipo
  LEFT JOIN usuarios t ON a.usuario_id = t.id_usuario
  ORDER BY a.fecha_asignacion DESC
`,
  }

  Promise.all([
    queryPromise(queries.distribucionEquipos),
    queryPromise(queries.totalEquipos),
    queryPromise(queries.usuariosTopEquipos),
    queryPromise(queries.historialAsignaciones),
    queryPromise(queries.listaAsignaciones),
  ])
    .then(([distribucionEquipos, [totalEquipos], usuariosTopEquipos, historialAsignaciones, listaAsignaciones]) => {
      res.render("reports/reporte_asignaciones", {
        title: "Asignaciones",
        page: "asignaciones",
        currentPath: req.currentPath || "/reportes/reporte_asignaciones",
        distribucionEquipos,
        totalEquipos,
        usuariosTopEquipos,
        historialAsignaciones,
        listaAsignaciones,
      })
    })
    .catch((error) => {
      console.error("Error:", error)
      res.status(500).send("Error en el servidor")
    })
}

// Este controlador genera un reporte de mantenimiento de equipos
exports.mostrarReporteMantenimiento = (req, res) => {
  const queries = {
    flujoReparaciones: `
          SELECT 
              SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
              SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
              SUM(CASE WHEN estado = 'reparado' THEN 1 ELSE 0 END) as completadas,
              SUM(CASE WHEN estado = 'descartado' THEN 1 ELSE 0 END) as descartadas
          FROM reparaciones
      `,
    equiposEnReparacion: `
          SELECT 
              e.id_equipo,
              e.nombre,
              e.marca,
              e.modelo,
              u.nombre as tecnico,
              r.fecha_inicio,
              r.estado
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          LEFT JOIN usuarios u ON r.tecnico_id = u.id_usuario
          WHERE r.estado = 'en_proceso'
      `,
    tiempoPromedio: `
          SELECT 
              AVG(DATEDIFF(COALESCE(fecha_finalizacion, CURRENT_TIMESTAMP), fecha_inicio)) as promedio_dias
          FROM reparaciones
          WHERE estado IN ('reparado', 'en_proceso')
      `,
    tiempoPorTipo: `
          SELECT 
              e.tipo,
              AVG(DATEDIFF(COALESCE(r.fecha_finalizacion, CURRENT_TIMESTAMP), r.fecha_inicio)) as dias
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          WHERE r.estado IN ('reparado', 'en_proceso')
          GROUP BY e.tipo
      `,
    tecnicosTop: `
          SELECT 
              u.nombre,
              COUNT(*) as reparaciones_completadas,
              ROUND((COUNT(CASE WHEN r.estado = 'reparado' THEN 1 END) * 100.0 / COUNT(*)), 1) as tasa_exito
          FROM reparaciones r
          JOIN usuarios u ON r.tecnico_id = u.id_usuario
          GROUP BY u.id_usuario, u.nombre
          HAVING COUNT(*) > 0
          ORDER BY reparaciones_completadas DESC
          LIMIT 5
      `,
    reparacionesPorMes: `
          SELECT 
              DATE_FORMAT(STR_TO_DATE(fecha_inicio, '%Y-%m-%d %H:%i:%s'), '%Y-%m') as mes,
              COUNT(*) as cantidad,
              SUM(CASE WHEN estado = 'reparado' THEN 1 ELSE 0 END) as completadas,
              SUM(CASE WHEN estado = 'descartado' THEN 1 ELSE 0 END) as descartadas,
              SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso
          FROM reparaciones
          WHERE fecha_inicio IS NOT NULL
          GROUP BY DATE_FORMAT(STR_TO_DATE(fecha_inicio, '%Y-%m-%d %H:%i:%s'), '%Y-%m')
          ORDER BY mes ASC
      `,
    reparacionesRetrasadas: `
          WITH TiempoPromedio AS (
              SELECT AVG(DATEDIFF(COALESCE(fecha_finalizacion, CURRENT_TIMESTAMP), fecha_inicio)) as promedio_dias
              FROM reparaciones
              WHERE estado IN ('reparado', 'en_proceso')
          )
          SELECT 
              e.nombre as nombre_equipo,
              DATEDIFF(CURRENT_TIMESTAMP, r.fecha_inicio) as dias_reparacion,
              u.nombre as nombre_tecnico,
              r.estado
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          LEFT JOIN usuarios u ON r.tecnico_id = u.id_usuario
          CROSS JOIN TiempoPromedio tp
          WHERE r.estado = 'en_proceso'
          AND DATEDIFF(CURRENT_TIMESTAMP, r.fecha_inicio) > tp.promedio_dias
          ORDER BY dias_reparacion DESC
      `,
    listaEquipos: `
          SELECT 
              e.id_equipo,
              e.nombre,
              e.tipo,
              r.estado,
              us.nombre as usuario_solicitante,
              ut.nombre as tecnico_asignado,
              r.descripcion_problema as descripcion,
              r.fecha_inicio,
              DATEDIFF(COALESCE(r.fecha_finalizacion, CURRENT_TIMESTAMP), r.fecha_inicio) as dias_reparacion
          FROM equipos e
          LEFT JOIN reparaciones r ON e.id_equipo = r.equipo_id
          LEFT JOIN usuarios us ON r.usuario_solicitante_id = us.id_usuario
          LEFT JOIN usuarios ut ON r.tecnico_id = ut.id_usuario
          WHERE r.estado IS NOT NULL
          ORDER BY r.fecha_inicio DESC;
      `,
    equiposPendientes: `
          SELECT 
              e.nombre,
              r.fecha_inicio as fecha_solicitud,
              u.nombre as solicitante,
              r.estado
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          LEFT JOIN usuarios u ON r.usuario_solicitante_id = u.id_usuario
          WHERE r.estado = 'pendiente'
          ORDER BY r.fecha_inicio DESC
      `,
    equiposCompletados: `
          SELECT 
              e.nombre,
              r.fecha_finalizacion,
              u.nombre as tecnico,
              DATEDIFF(r.fecha_finalizacion, r.fecha_inicio) as dias_reparacion
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          LEFT JOIN usuarios u ON r.tecnico_id = u.id_usuario
          WHERE r.estado = 'reparado'
          ORDER BY r.fecha_finalizacion DESC
          LIMIT 10
      `,
    equiposDescartados: `
          SELECT 
              e.nombre,
              r.fecha_finalizacion as fecha_descarte,
              r.motivo_descarte
          FROM reparaciones r
          JOIN equipos e ON r.equipo_id = e.id_equipo
          WHERE r.estado = 'descartado'
          ORDER BY r.fecha_finalizacion DESC
          LIMIT 10
      `,
    motivosDescarte: `
          SELECT 
              motivo_descarte as razon,
              COUNT(*) as cantidad,
              ROUND(COUNT(*) * 100.0 / (
                  SELECT COUNT(*) 
                  FROM reparaciones 
                  WHERE estado = 'descartado'
              ), 1) as porcentaje
          FROM reparaciones
          WHERE estado = 'descartado'
          GROUP BY motivo_descarte
          ORDER BY cantidad DESC
      `,
  }

  Promise.all([
    queryPromise(queries.flujoReparaciones),
    queryPromise(queries.equiposEnReparacion),
    queryPromise(queries.tiempoPromedio),
    queryPromise(queries.tiempoPorTipo),
    queryPromise(queries.tecnicosTop),
    queryPromise(queries.reparacionesPorMes),
    queryPromise(queries.reparacionesRetrasadas),
    queryPromise(queries.listaEquipos),
    queryPromise(queries.equiposPendientes),
    queryPromise(queries.equiposCompletados),
    queryPromise(queries.equiposDescartados),
    queryPromise(queries.motivosDescarte),
  ])
    .then(
      ([
        flujoReparaciones,
        equiposEnReparacion,
        [tiempoGeneral],
        tiempoPorTipo,
        tecnicosTop,
        reparacionesPorMes,
        reparacionesRetrasadas,
        listaEquipos,
        equiposPendientes,
        equiposCompletados,
        equiposDescartados,
        motivosDescarte,
      ]) => {
        res.render("reports/reporte_mantenimiento", {
          equiposPendientes,
          equiposCompletados,
          equiposDescartados,
          motivosDescarte,
          flujoReparaciones: flujoReparaciones[0],
          title: "Mantenimiento",
          page: "mantenimiento",
          currentPath: req.currentPath || "/reportes/reporte_mantenimiento",
          equipos: listaEquipos,
          equiposEnReparacion,
          tiempoPromedio: {
            general: Math.round(tiempoGeneral.promedio_dias || 0),
            porTipo: tiempoPorTipo.map((tipo) => ({
              tipo: tipo.tipo,
              dias: Math.round(tipo.dias || 0),
            })),
          },
          tecnicosTop,
          reparacionesPorMes,
          reparacionesRetrasadas,
          listaEquipos,
        })
      },
    )
    .catch((error) => {
      console.error("Error:", error)
      res.status(500).send("Error en el servidor")
    })
}

