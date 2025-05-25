
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
   
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
   
    nombre: { 
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nombre descriptivo de la ruta (ej: Ruta Centro, Ruta Lota Mañana)'
    },
    descripcion: { 
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción opcional más detallada de la ruta'
    },
    puntos: { 
        type: DataTypes.JSON, 
        allowNull: false,
        comment: 'Array de puntos [lat, lon] que definen la ruta. Ej: [[-36.8, -73.0], [-36.81, -73.01]]'
       
    },

     createdAt: {
         type: DataTypes.DATE,
         
     },
     updatedAt: {
         type: DataTypes.DATE,
       
     }
}, {
    tableName: 'rutas', 
    timestamps: false, 
    comment: 'Tabla para almacenar las rutas predefinidas'
});

// --- Relaciones (PENDIENTE Más Adelante) ---
// ...

module.exports = Route;