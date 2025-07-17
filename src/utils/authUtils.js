// Elimina todo el contenido relacionado con JWT, solo deja utilidades necesarias para Google/Firebase o deja el archivo vacío si no hay nada útil.

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Utilidades para autenticación y autorización
 */
class AuthUtils {
  /**
   * Generar token JWT
   * @param {Object} payload - Datos a incluir en el token
   * @param {string} secret - Clave secreta
   * @param {string} expiresIn - Tiempo de expiración
   * @returns {string} - Token JWT
   */
  static generarJWT(payload, secret = process.env.JWT_SECRET, expiresIn = '24h') {
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verificar token JWT
   * @param {string} token - Token a verificar
   * @param {string} secret - Clave secreta
   * @returns {Object} - Payload decodificado
   */
  static verificarJWT(token, secret = process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  /**
   * Generar hash de contraseña
   * @param {string} password - Contraseña en texto plano
   * @param {number} saltRounds - Número de rondas de salt
   * @returns {string} - Hash de la contraseña
   */
  static async hashPassword(password, saltRounds = 12) {
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Comparar contraseña con hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hash - Hash de la contraseña
   * @returns {boolean} - True si coinciden
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generar token de recuperación
   * @param {number} length - Longitud del token
   * @returns {string} - Token aleatorio
   */
  static generarTokenRecuperacion(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generar código de verificación
   * @param {number} length - Longitud del código
   * @returns {string} - Código numérico
   */
  static generarCodigoVerificacion(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Validar fortaleza de contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} - Resultado de la validación
   */
  static validarFortalezaContraseña(password) {
    const errores = [];
    const sugerencias = [];

    if (password.length < 8) {
      errores.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[a-z]/.test(password)) {
      errores.push('La contraseña debe contener al menos una letra minúscula');
      sugerencias.push('Agrega letras minúsculas');
    }

    if (!/[A-Z]/.test(password)) {
      errores.push('La contraseña debe contener al menos una letra mayúscula');
      sugerencias.push('Agrega letras mayúsculas');
    }

    if (!/\d/.test(password)) {
      errores.push('La contraseña debe contener al menos un número');
      sugerencias.push('Agrega números');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errores.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
      sugerencias.push('Agrega caracteres especiales');
    }

    const fortaleza = this.calcularFortalezaContraseña(password);

    return {
      valida: errores.length === 0,
      errores,
      sugerencias,
      fortaleza
    };
  }

  /**
   * Calcular fortaleza de contraseña
   * @param {string} password - Contraseña a evaluar
   * @returns {string} - Nivel de fortaleza
   */
  static calcularFortalezaContraseña(password) {
    let puntuacion = 0;

    // Longitud
    if (password.length >= 8) puntuacion += 1;
    if (password.length >= 12) puntuacion += 1;

    // Complejidad
    if (/[a-z]/.test(password)) puntuacion += 1;
    if (/[A-Z]/.test(password)) puntuacion += 1;
    if (/\d/.test(password)) puntuacion += 1;
    if (/[@$!%*?&]/.test(password)) puntuacion += 1;

    // Caracteres únicos
    const caracteresUnicos = new Set(password).size;
    if (caracteresUnicos >= 8) puntuacion += 1;

    // Patrones comunes
    if (!/(.)\1{2,}/.test(password)) puntuacion += 1; // No repeticiones de 3+
    if (!/(123|abc|qwe)/i.test(password)) puntuacion += 1; // No secuencias comunes

    if (puntuacion <= 3) return 'débil';
    if (puntuacion <= 5) return 'media';
    if (puntuacion <= 7) return 'fuerte';
    return 'muy fuerte';
  }

  /**
   * Validar email
   * @param {string} email - Email a validar
   * @returns {boolean} - True si es válido
   */
  static validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar teléfono
   * @param {string} telefono - Teléfono a validar
   * @returns {boolean} - True si es válido
   */
  static validarTelefono(telefono) {
    const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return telefonoRegex.test(telefono);
  }

  /**
   * Sanitizar datos de entrada
   * @param {Object} data - Datos a sanitizar
   * @returns {Object} - Datos sanitizados
   */
  static sanitizarDatos(data) {
    const sanitizado = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitizado[key] = value.trim().replace(/[<>]/g, '');
      } else {
        sanitizado[key] = value;
      }
    }
    
    return sanitizado;
  }

  /**
   * Generar salt aleatorio
   * @param {number} length - Longitud del salt
   * @returns {string} - Salt aleatorio
   */
  static generarSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generar hash con salt personalizado
   * @param {string} data - Datos a hashear
   * @param {string} salt - Salt personalizado
   * @returns {string} - Hash resultante
   */
  static generarHashConSalt(data, salt) {
    return crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512').toString('hex');
  }

  /**
   * Verificar hash con salt
   * @param {string} data - Datos originales
   * @param {string} salt - Salt usado
   * @param {string} hash - Hash a verificar
   * @returns {boolean} - True si coinciden
   */
  static verificarHashConSalt(data, salt, hash) {
    const hashCalculado = this.generarHashConSalt(data, salt);
    return hashCalculado === hash;
  }

  /**
   * Generar token de sesión único
   * @returns {string} - Token único
   */
  static generarTokenSesion() {
    return crypto.randomBytes(32).toString('hex') + Date.now().toString(36);
  }

  /**
   * Calcular tiempo de expiración
   * @param {string} unidad - Unidad de tiempo (h, d, w, m, y)
   * @param {number} cantidad - Cantidad de unidades
   * @returns {Date} - Fecha de expiración
   */
  static calcularExpiracion(unidad = 'h', cantidad = 24) {
    const ahora = new Date();
    
    switch (unidad) {
      case 'h':
        return new Date(ahora.getTime() + cantidad * 60 * 60 * 1000);
      case 'd':
        return new Date(ahora.getTime() + cantidad * 24 * 60 * 60 * 1000);
      case 'w':
        return new Date(ahora.getTime() + cantidad * 7 * 24 * 60 * 60 * 1000);
      case 'm':
        return new Date(ahora.getTime() + cantidad * 30 * 24 * 60 * 60 * 1000);
      case 'y':
        return new Date(ahora.getTime() + cantidad * 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Verificar si un token ha expirado
   * @param {string} token - Token JWT
   * @returns {boolean} - True si ha expirado
   */
  static tokenExpirado(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extraer información del token sin verificar
   * @param {string} token - Token JWT
   * @returns {Object|null} - Información del token
   */
  static extraerInfoToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generar fingerprint del dispositivo
   * @param {Object} userAgent - User agent string
   * @param {string} ip - IP del cliente
   * @returns {string} - Fingerprint único
   */
  static generarFingerprint(userAgent, ip) {
    const data = `${userAgent}-${ip}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validar formato de fecha
   * @param {string} fecha - Fecha a validar
   * @returns {boolean} - True si es válida
   */
  static validarFecha(fecha) {
    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Calcular edad desde fecha de nacimiento
   * @param {string} fechaNacimiento - Fecha de nacimiento
   * @returns {number} - Edad en años
   */
  static calcularEdad(fechaNacimiento) {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Validar edad mínima
   * @param {string} fechaNacimiento - Fecha de nacimiento
   * @param {number} edadMinima - Edad mínima requerida
   * @returns {boolean} - True si cumple la edad mínima
   */
  static validarEdadMinima(fechaNacimiento, edadMinima = 13) {
    const edad = this.calcularEdad(fechaNacimiento);
    return edad >= edadMinima;
  }

  /**
   * Generar nombre de archivo seguro
   * @param {string} nombreOriginal - Nombre original del archivo
   * @returns {string} - Nombre seguro
   */
  static generarNombreArchivoSeguro(nombreOriginal) {
    const extension = nombreOriginal.split('.').pop();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * Validar formato de imagen
   * @param {string} filename - Nombre del archivo
   * @returns {boolean} - True si es una imagen válida
   */
  static validarImagen(filename) {
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = filename.split('.').pop().toLowerCase();
    return extensionesPermitidas.includes(extension);
  }

  /**
   * Generar URL segura
   * @param {string} texto - Texto a convertir en URL
   * @returns {string} - URL segura
   */
  static generarUrlSegura(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
}

module.exports = AuthUtils; 