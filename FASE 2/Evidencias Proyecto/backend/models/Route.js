// backend/models/Route.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
    // Mantenemos id, createdAt, updatedAt con nombres estándar por simplicidad con Sequelize
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    // --- Campos traducidos ---
    nombre: { // Antes era 'name'
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre descriptivo de la ruta (ej: Ruta Centro, Ruta Lota Mañana)'
    },
    descripcion: { // Antes era 'description'
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción opcional más detallada de la ruta'
    },
    puntos: { // Antes era 'points'
        type: DataTypes.JSON, // Usamos el tipo JSON
        allowNull: false,
        comment: 'Array de puntos [lat, lon] que definen la ruta. Ej: [[-36.8, -73.0], [-36.81, -73.01]]'
        // Nota: Requiere MySQL >= 5.7 o MariaDB >= 10.2 para el tipo JSON nativo.
    },
     // --- Campos automáticos (mantenemos nombres estándar) ---
     createdAt: {
         type: DataTypes.DATE,
         //allowNull: false, // Sequelize lo maneja
         //defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Sequelize lo maneja
     },
     updatedAt: {
         type: DataTypes.DATE,
        // allowNull: false,
        // defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
     }
}, {
    tableName: 'rutas', // <-- Cambiamos nombre de tabla a español
    timestamps: true, // Sequelize buscará columnas llamadas 'createdAt' y 'updatedAt'
    comment: 'Tabla para almacenar las rutas predefinidas'
});

// --- Relaciones (PENDIENTE Más Adelante) ---
// ...

module.exports = Route;