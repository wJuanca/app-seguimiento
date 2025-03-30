const conexion = require("../database/db")
const bcrypt = require("bcryptjs")

// Mostrar formulario de login
exports.mostrarLogin = (req, res) => {
  res.render("auth/login")
}

// Iniciar sesión
exports.iniciarSesion = (req, res) => {
  const { correo, contrasena } = req.body

  if (!correo || !contrasena) {
    req.flash("error", "Todos los campos son obligatorios")
    return res.redirect("/auth/login")
  }

  // Buscar usuario por correo
  conexion.query("SELECT * FROM usuarios WHERE correo = ?", [correo], async (error, resultados) => {
    if (error) {
      console.error("Error al buscar usuario:", error)
      req.flash("error", "Error al iniciar sesión")
      return res.redirect("/auth/login")
    }

    if (resultados.length === 0) {
      req.flash("error", "Credenciales incorrectas")
      return res.redirect("/auth/login")
    }

    const usuario = resultados[0]

    // Aquí estamos comparando directamente porque asumimos que las contraseñas no están hasheadas en tu BD actual
    if (usuario.contrasena !== contrasena) {
      req.flash("error", "Credenciales incorrectas")
      return res.redirect("/auth/login")
    }

    // Guardar usuario en sesión (sin la contraseña)
    const usuarioSesion = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    }

    req.session.usuario = usuarioSesion

    // Redirigir según el rol
    if (usuario.rol === "admin") {
      res.redirect("/")
    } else if (usuario.rol === "tecnico") {
      res.redirect("/reparaciones")
    } else {
      res.redirect("/mi-equipo")
    }
  })
}

// Cerrar sesión
exports.cerrarSesion = (req, res) => {
  req.session.destroy()
  res.redirect("/auth/login")
}

