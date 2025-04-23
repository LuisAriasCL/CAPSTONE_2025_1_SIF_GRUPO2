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
        unique: true, 
        validate: {
            isEmail: true 
        }
    },
    password: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM(ROLES),
        allowNull: false,
        defaultValue: 'driver' 
    }

}, {
    tableName: 'users', 
    timestamps: true
});

module.exports = User;