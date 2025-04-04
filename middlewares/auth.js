// Middleware para verificar si el usuario está autenticado
exports.verificarAutenticacion = (req, res, next) => {
  if (req.session.usuario) {
    return next()
  }

  req.flash("error", "Debe iniciar sesión para acceder a esta página")
  res.redirect("/auth/login")
}

// Middleware para verificar el rol del usuario
exports.verificarRol = (roles) => {
  return (req, res, next) => {
    if (!req.session.usuario) {
      req.flash("error", "Debe iniciar sesión para acceder a esta página")
      return res.redirect("/auth/login")
    }

    if (roles.includes(req.session.usuario.rol)) {
      return next()
    }

    req.flash("error", "No tiene permisos para acceder a esta página")
    res.redirect("/")
  }
}

