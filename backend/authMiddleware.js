const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token)
    return res.status(401).json({ message: "Token no proporcionado" });

  const bearer = token.split(" ");
  if (bearer.length !== 2 || bearer[0] !== "Bearer")
    return res.status(401).json({ message: "Formato de token inválido" });

  jwt.verify(bearer[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });

    req.usuario = decoded; // contiene el payload del token (ej: rut, tipo, etc.)
    next();
  });
};

module.exports = authMiddleware;
