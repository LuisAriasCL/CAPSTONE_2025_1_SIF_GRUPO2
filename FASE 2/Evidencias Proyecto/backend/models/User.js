// backend/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const ROLES = ['admin', 'gestor', 'mantenimiento', 'conductor']; // Ajusta o añade según necesites

const User = sequelize.define('User', {
    id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // El email debe ser único
        validate: {
            isEmail: true // Validación incorporada de Sequelize
        }
    },
    password: {
        type: DataTypes.STRING, // Guardará el HASH de la contraseña, no el texto plano
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM(ROLES),
        allowNull: false,
        defaultValue: 'driver' // Establece un rol por defecto (ajusta según tu lógica)
    }
    // createdAt y updatedAt se añaden automáticamente por defecto (timestamps: true)
}, {
    tableName: 'users', // Nombre de la tabla en la base de datos
    timestamps: true
});

module.exports = User;