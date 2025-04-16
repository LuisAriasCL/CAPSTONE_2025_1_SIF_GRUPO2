// backend/models/Vehicle.js

// 1. Importar los tipos de datos de Sequelize y la instancia de conexión
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Importamos la conexión configurada

// 2. Definir el modelo 'Vehicle' usando sequelize.define()
// El primer argumento es el nombre del modelo (usualmente en singular y capitalizado)
// El segundo argumento es un objeto que define las columnas de la tabla
const Vehicle = sequelize.define('Vehicle', {
    // Sequelize añade automáticamente una columna 'id' como clave primaria (INT AUTO_INCREMENT)
    // a menos que definamos explícitamente otra clave primaria.

    name: {
        type: DataTypes.STRING, // Tipo de dato: Cadena de texto (VARCHAR(255) por defecto)
        allowNull: false       // No puede ser nulo (NOT NULL)
    },
    plate: {
        type: DataTypes.STRING(50), // VARCHAR con longitud máxima de 50
        allowNull: false,
        unique: true             // Debe ser único en la tabla
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8), // Número decimal con precisión total de 10 y 8 decimales
        allowNull: true,              // Puede ser nulo
        defaultValue: 0.0            // Valor por defecto si no se especifica
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8), // Precisión total de 11 y 8 decimales
        allowNull: true,
        defaultValue: 0.0
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'maintenance'), // Solo permite estos valores
        defaultValue: 'active'    // Valor por defecto
    }
    // Las columnas 'createdAt' y 'updatedAt' (tipo DATETIME) son añadidas y gestionadas
    // automáticamente por Sequelize si no se deshabilita la opción 'timestamps'.
}, {
    // 3. Opciones adicionales del modelo
    tableName: 'vehicles', // Nombre exacto de la tabla en la base de datos
                           // Si no se especifica, Sequelize intentaría usar 'Vehicles' (pluralizado)
    timestamps: true       // Habilita las columnas createdAt y updatedAt (activado por defecto)
                           // Sequelize las llenará automáticamente al crear/actualizar registros
});

// 4. Exportar el modelo para que pueda ser usado en otras partes (ej. en las rutas)
module.exports = Vehicle;