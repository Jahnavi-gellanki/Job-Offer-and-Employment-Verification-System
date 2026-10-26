const authorize = (...roles) => {
  // Flatten in case arrays are passed
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this route. Required roles: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authorize,
};
