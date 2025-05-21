// backend/models/Vehicle.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definimos los ESTADOS en español para el ENUM
const ESTADOS_VEHICULO = ['activo', 'inactivo', 'mantenimiento', 'taller'];

const Vehicle = sequelize.define('Vehicle', { // Nombre del Modelo sigue siendo 'Vehicle'
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    
    name: { 
        type: DataTypes.STRING,
        allowNull: false,
        trim: true
    },
    plate: { // Patente
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: true,
        trim: true
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        defaultValue: 0
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        defaultValue: 0
    },
    status: { 
        type: DataTypes.ENUM(ESTADOS_VEHICULO), 
        defaultValue: 'activo',
        allowNull: false,
        comment: 'Estado actual del vehículo'
    },
   
    anio: { 
        type: DataTypes.INTEGER,
        allowNull: true
    },
    marca: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    modelo: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    chasis: { 
        type: DataTypes.STRING,
        allowNull: true,
        unique: true // VIN debería ser único
    },
    tipoVehiculo: { 
         type: DataTypes.STRING,
         allowNull: true
    },
    proyecto: { 
         type: DataTypes.STRING,
         allowNull: true
    },
    kilometraje: { 
         type: DataTypes.INTEGER,
         allowNull: true,
         defaultValue: 0
    },
   
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE }
}, {
    tableName: 'vehicles', 
    timestamps: true,
    comment: 'Tabla para almacenar información de los vehículos de la flota'
});


module.exports = Vehicle; 