// models/Vehiculo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Asegúrate que la ruta a tu instancia de Sequelize sea correcta

const Vehiculo = sequelize.define('Vehiculo', {
  idVehi: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    field: 'id_vehi',
    comment: 'Número de identificador del vehículo (PK)'
  },
  patente: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    field: 'patente',
    comment: 'Patente del vehículo (ej. AA1234 o AAAA12)'
  },
  chasis: {
    type: DataTypes.STRING(17),
    allowNull: false,
    unique: true,
    field: 'chasis',
    comment: 'Número de chasis del vehículo (VIN)'
  },
  tipoVehi: {
    type: DataTypes.STRING(20),
    allowNull: true, // Según el DDL, es nullable. Cambiar si es requerido.
    field: 'tipo_vehi',
    comment: 'Tipo del vehículo (ej: ligero, mediano, pesado, sedan, camioneta, furgon)'
  },
  estadoVehi: {
    type: DataTypes.ENUM('activo', 'inactivo', 'mantenimiento', 'taller'),
    allowNull: false,
    defaultValue: 'activo',
    field: 'estado_vehi',
    comment: 'Estado actual del vehículo'
  },
  tipoCombVehi: {
    type: DataTypes.ENUM('gasolina_93', 'gasolina_95', 'gasolina_97', 'diesel', 'electrico', 'otro'),
    allowNull: true, // Según el DDL, es nullable. Cambiar si es requerido.
    field: 'tipo_comb_vehi',
    comment: 'Tipo de combustible principal del vehículo'
  },
  kmVehi: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    field: 'km_vehi',
    comment: 'Kilometraje actual del vehículo'
  },
  marca: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'marca',
    comment: 'Marca del vehículo (ej. Toyota)'
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'modelo',
    comment: 'Modelo del vehículo (ej. Hilux)'
  },
  anio: {
    type: DataTypes.INTEGER, // Sequelize no tiene un tipo YEAR directo, se usa INTEGER para el año (4 dígitos)
    allowNull: false,
    field: 'anio',
    validate: { // Opcional: validación para asegurar que sea un año razonable
      isInt: true,
      min: 1900,
      max: new Date().getFullYear() + 5 // Un margen pequeño hacia el futuro
    },
    comment: 'Año de fabricación del vehículo (ej. 2023)'
  },
  kmVidaUtil: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'km_vida_util',
    comment: 'Kilometraje estimado de vida útil del vehículo'
  },
  efiComb: {
    type: DataTypes.DECIMAL(5, 2), // Coincide con DECIMAL(5,2) en MySQL
    allowNull: true,
    field: 'efi_comb',
    comment: 'Eficiencia de combustible (km/l o kWh/km para eléctricos). Ej: 12.50'
  },
  fecAdqui: {
    type: DataTypes.DATEONLY, // Para campos DATE de MySQL (solo fecha, sin hora)
    allowNull: false,
    field: 'fec_adqui',
    comment: 'Fecha de adquisición del vehículo'
  },
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    field: 'latitud',
    comment: 'Última coordenada de latitud conocida del vehículo'
  },
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    field: 'longitud',
    comment: 'Última coordenada de longitud conocida del vehículo'
  }
}, {
  tableName: 'VEHICULO', // Nombre exacto de la tabla en la BD
  timestamps: false,     // ¡Importante! No se usarán los campos createdAt y updatedAt automáticos de Sequelize
  comment: 'Tabla para almacenar la información detallada de los vehículos de la flota'
  // Aquí podrías añadir índices si no están definidos directamente en la BD y quieres que Sequelize los conozca,
  // o si quieres que Sequelize los cree (aunque es mejor definirlos en el DDL de MySQL).
  // indexes: [
  //   { unique: true, fields: ['patente'] }, // Sequelize puede crear índices, pero UNIQUE ya lo hace a nivel BD
  //   { unique: true, fields: ['chasis'] },
  //   { fields: ['estado_vehi'] }
  // ]
});

// Aquí irían las asociaciones con otros modelos, por ejemplo:
// Vehiculo.hasMany(models.Mantenimiento, { foreignKey: 'VEHICULO_id_vehi', as: 'mantenimientos' });
// Vehiculo.hasMany(models.Siniestro, { foreignKey: 'VEHICULO_id_vehi', as: 'siniestros' });
// etc.

module.exports = Vehiculo;