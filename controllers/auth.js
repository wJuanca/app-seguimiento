const conexion = require("../database/db")
const bcrypt = require("bcryptjs")

//Mostramos el formulario del login para todos los usuarios
exports.mostrarLogin = (req, res) => {
  res.render("auth/login")
}

// Esperamos que el usuario ingrese las credenciales de correo y contrasena, pero si no llena un campo se le muestra un mensaje
exports.iniciarSesion = (req, res) => {
  const { correo, contrasena } = req.body

  if (!correo || !contrasena) {
    req.flash("error", "Todos los campos son obligatorios")
    return res.redirect("/auth/login")
  }

  // Buscamos el usuario por correo para poder validar las credenciales
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

    //Aqui estanos comparando directamente porque las contrasenas no estan hasheadas en la base de datos
    if (usuario.contrasena !== contrasena) {
      req.flash("error", "Credenciales incorrectas")
      return res.redirect("/auth/login")
    }

    // Guardar usuario en sesion, pero la contrasena por seguridas
    const usuarioSesion = {
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    }

    req.session.usuario = usuarioSesion

    //Segun el rol que tenfa el usuario se le redirigira a una seccion especifica
    if (usuario.rol === "admin") {
      res.redirect("/")
    } else if (usuario.rol === "tecnico") {
      res.redirect("/reparaciones")
    } else {
      res.redirect("/mi-equipo")
    }
  })
}

// Con esta funcion cerramos la sesion y lo mandamos al login
exports.cerrarSesion = (req, res) => {
  req.session.destroy()
  res.redirect("/auth/login")
}

