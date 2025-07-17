/**
 * Middleware para manejar funciones asíncronas y capturar errores
 * Evita tener que usar try-catch en cada controlador
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;