# API de Sistema de Gestión de Peluquería

Sistema completo de gestión para peluquerías que incluye gestión de citas, clientes, empleados, servicios, pagos y más.

## 🚀 Características

- **Gestión de Citas**: Agendar, modificar y cancelar citas
- **Gestión de Clientes**: Registro y seguimiento de clientes
- **Gestión de Empleados**: Control de empleados y horarios
- **Gestión de Servicios**: Catálogo de servicios con precios
- **Sistema de Pagos**: Procesamiento de pagos y facturación
- **Galería de Trabajos**: Mostrar trabajos realizados
- **Sistema de Roles**: Administrador, Empleado, Cliente, Dueño
- **Notificaciones**: Email y push notifications
- **Reportes**: Estadísticas y reportes de negocio

## 🛠️ Tecnologías

- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL 8.0
- **Autenticación**: JWT + Firebase Auth
- **Upload de Archivos**: Multer
- **Validación**: Joi
- **Email**: Nodemailer
- **Seguridad**: Helmet, CORS, Rate Limiting

## 📋 Requisitos Previos

- Node.js 16+ 
- MySQL 8.0+
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd peluqueria-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos**
- Crear base de datos MySQL: `peluqueria_db`
- Ejecutar el script SQL: `tablas sql usadas en la base de datos.sql`

4. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
# Base de datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=peluqueria_db
DB_USER=root
DB_PASSWORD=2002

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro

# Servidor
PORT=3000
NODE_ENV=development

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password

# Firebase (opcional)
FIREBASE_PROJECT_ID=tu_proyecto_firebase
FIREBASE_PRIVATE_KEY=tu_private_key
FIREBASE_CLIENT_EMAIL=tu_client_email
```

5. **Ejecutar migraciones (si es necesario)**
```bash
npm run migrate
```

6. **Iniciar servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **usuarios**: Información básica de usuarios
- **roles**: Roles del sistema (administrador, empleado, cliente, dueño)
- **clientes**: Información específica de clientes
- **empleados**: Información específica de empleados
- **servicios**: Catálogo de servicios
- **citas**: Gestión de citas
- **pagos**: Procesamiento de pagos
- **productos**: Inventario de productos
- **galerias**: Galería de trabajos realizados

### Relaciones Principales

- Usuario → Cliente/Empleado (1:1)
- Usuario → Rol (N:1)
- Cita → Cliente (N:1)
- Cita → Empleado (N:1)
- Cita → Servicios (N:N)

## 🔐 Sistema de Roles y Permisos

### Roles Disponibles

1. **Administrador**: Control total del sistema
2. **Dueño**: Acceso a funciones administrativas
3. **Empleado**: Gestión de citas y clientes
4. **Cliente**: Acceso a su perfil y citas

### Permisos por Recurso

Cada recurso tiene permisos específicos:
- **CREAR**: Crear nuevos registros
- **LEER**: Ver registros
- **ACTUALIZAR**: Modificar registros
- **ELIMINAR**: Eliminar registros

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `POST /api/auth/refresh` - Renovar token

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Citas
- `GET /api/citas` - Listar citas
- `POST /api/citas` - Crear cita
- `GET /api/citas/:id` - Obtener cita
- `PUT /api/citas/:id` - Actualizar cita
- `DELETE /api/citas/:id` - Cancelar cita

### Servicios
- `GET /api/servicios` - Listar servicios
- `POST /api/servicios` - Crear servicio
- `GET /api/servicios/:id` - Obtener servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/:id` - Obtener cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Empleados
- `GET /api/empleados` - Listar empleados
- `POST /api/empleados` - Crear empleado
- `GET /api/empleados/:id` - Obtener empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Eliminar empleado

## 🔧 Middleware Disponibles

### Autenticación
- `auth`: Verificar token JWT
- `isAdmin`: Solo administradores
- `isEmployee`: Empleados y superiores
- `isClient`: Solo clientes
- `isOwner`: Solo dueños

### Validación
- `validateInput`: Validar datos de entrada
- `validateCitaOwnership`: Verificar propiedad de cita
- `validateService`: Verificar existencia de servicio
- `validateEmployee`: Verificar existencia de empleado
- `validateClient`: Verificar existencia de cliente

### Upload
- `uploadProfile`: Subir foto de perfil
- `uploadGallery`: Subir imágenes de galería
- `uploadService`: Subir imagen de servicio
- `uploadProduct`: Subir imagen de producto

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── database.js      # Configuración MySQL
│   └── roles.js         # Configuración de roles
├── controllers/         # Controladores
├── middleware/
│   ├── auth.js          # Autenticación
│   ├── upload.js        # Upload de archivos
│   ├── validation.js    # Validaciones
│   └── errorHandler.js  # Manejo de errores
├── models/              # Modelos de datos
├── routes/              # Rutas de la API
└── utils/               # Utilidades
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📊 Scripts Disponibles

- `npm start`: Iniciar en producción
- `npm run dev`: Iniciar en desarrollo
- `npm test`: Ejecutar tests
- `npm run lint`: Linting del código
- `npm run migrate`: Ejecutar migraciones

## 🔒 Seguridad

- Autenticación JWT
- Validación de entrada con Joi
- Rate limiting
- Helmet para headers de seguridad
- CORS configurado
- Sanitización de datos

## 📝 Licencia

MIT License

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte técnico, contacta a:
- Email: soporte@peluqueria.com
- Teléfono: +1 234 567 890

---

Desarrollado con ❤️ para el sector de la peluquería 