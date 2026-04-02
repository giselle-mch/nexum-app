const checkRole = (...allowedRoles) => {
  return (req, res, next) => {

    const userRole = req.user.rol;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "No tienes permiso para realizar esta acción"
      });
    }

    next();
  };
};

module.exports = checkRole;