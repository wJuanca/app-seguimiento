// Middleware para verificar autenticación y roles
const verificarAutenticacion = (req, res, next) => {
  if (!req.session.usuario) {
    req.flash("error", "Debe iniciar sesión para acceder a esta página")
    return res.redirect("/auth/login")
  }
  next()
}

// Middleware para verificar roles
const verificarRol = (roles) => {
  return (req, res, next) => {
    if (!req.session.usuario) {
      req.flash("error", "Debe iniciar sesión para acceder a esta página")
      return res.redirect("/auth/login")
    }

    // Si el usuario es admin, permitir acceso a todo
    if (req.session.usuario.rol === "admin") {
      return next()
    }

    // Si el rol del usuario está en la lista de roles permitidos
    if (roles.includes(req.session.usuario.rol)) {
      return next()
    }

    req.flash("error", "No tiene permisos para acceder a esta página")
    return res.redirect("/")
  }
}

// Middleware para verificar que el usuario solo acceda a sus propios recursos
const verificarUsuario = (req, res, next) => {
  if (!req.session.usuario) {
    req.flash("error", "Debe iniciar sesión para acceder a esta página")
    return res.redirect("/auth/login")
  }

  // Si el usuario es admin, permitir acceso a todo
  if (req.session.usuario.rol === "admin") {
    return next()
  }

  // Verificar si el ID del recurso coincide con el ID del usuario
  const idRecurso = Number.parseInt(req.params.id)
  const idUsuario = req.session.usuario.id

  if (idRecurso === idUsuario) {
    return next()
  }

  req.flash("error", "No tiene permisos para acceder a este recurso")
  return res.redirect("/")
}

module.exports = {
  verificarAutenticacion,
  verificarRol,
  verificarUsuario,
}

