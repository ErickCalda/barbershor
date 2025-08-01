// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const createDirectories = () => {
  const dirs = ['uploads/', 'uploads/perfiles/', 'uploads/galeria/', 'uploads/servicios/', 'uploads/productos/'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = 'uploads/';

    // Se fuerza automáticamente a guardar en 'servicios' para uploadService
if (req.uploadType === 'servicio') {
  uploadDir = 'uploads/media/';
}
else if (req.body.tipo === 'perfil') {
      uploadDir = 'uploads/perfiles/';
    } else if (req.body.tipo === 'galeria') {
      uploadDir = 'uploads/galeria/';
    } else if (req.body.tipo === 'producto') {
      uploadDir = 'uploads/productos/';
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Límites del archivo
const limits = {
  fileSize: 10 * 1024 * 1024,
  files: 5
};

const upload = multer({
  storage,
  limits,
  fileFilter
});

// ⚠️ Se envuelve multer para que sepa automáticamente que es una imagen de tipo 'servicio'
const uploadService = (req, res, next) => {
  req.uploadType = 'media'; // Esto fuerza el tipo a 'servicio'
  upload.single('imagen_servicio')(req, res, next);
};

// Manejo de errores
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Archivo demasiado grande. Máx 10MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Máximo 5 archivos permitidos' });
    }
  }

  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ success: false, message: error.message });
  }

  return res.status(500).json({ success: false, message: 'Error al subir archivo' });
};

// Otros exports
const uploadProfile = upload.single('foto_perfil');
const uploadGallery = upload.array('imagenes', 5);
const uploadProduct = upload.single('imagen_producto');
const uploadMultiple = upload.array('archivos', 5);

const validateImageDimensions = (req, res, next) => {
  if (!req.file && !req.files) return next();

  const files = req.file ? [req.file] : req.files;

  files.forEach(file => {
    if (file.mimetype.startsWith('image/') && req.uploadType === 'perfil') {
      console.log('Validando imagen de perfil:', file.filename);
    }
  });

  next();
};

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Archivo eliminado: ${filePath}`);
  }
};

const getFileUrl = (filename, tipo = 'general') => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${tipo}/${filename}`;
};

module.exports = {
  upload,
  uploadProfile,
  uploadGallery,
  uploadService,
  uploadProduct,
  uploadMultiple,
  handleUploadError,
  validateImageDimensions,
  deleteFile,
  getFileUrl
};
