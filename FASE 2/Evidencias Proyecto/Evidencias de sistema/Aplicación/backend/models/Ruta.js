// backend/models/Ruta.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Asegúrate que la ruta sea correcta

const Ruta = sequelize.define('Ruta', {
  idRuta: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    field: 'id_ruta'
  },
  nombreRuta: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nom_ruta'
  },
  descripcionRuta: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'desc_ruta'
  },
  puntosRuta: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'puntos'
  },
  kilometrosRuta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'km_ruta'
  }
}, {
  tableName: 'RUTA',
  timestamps: false, // Siguiendo el patrón de no usar timestamps automáticos de Sequelize
  comment: 'Tabla para almacenar rutas predefinidas o registradas'
});

module.exports = Ruta;