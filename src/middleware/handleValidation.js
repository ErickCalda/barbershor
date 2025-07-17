const { validationResult } = require('express-validator');

/**
 * Middleware para manejar los resultados de las validaciones de express-validator.
 * Si hay errores, responde con un 400 y los errores. Si no, pasa al siguiente middleware.
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    next();
};

module.exports = handleValidation;
