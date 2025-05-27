// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);


const sequelize = require('../config/database');

const db = {};

// Cargar dinámicamente todos los archivos de modelo de este directorio
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&    
      file !== basename &&          
      file.slice(-3) === '.js' &&  
      file.indexOf('.test.js') === -1 
    );
  })
  .forEach(file => {
    // Cada archivo de modelo debe exportar una función que toma (sequelize, DataTypes)
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Almacena el modelo en el objeto db usando su nombre
  });


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});



// Modelo: AsignacionRecorrido
if (db.AsignacionRecorrido && db.Vehiculo) {
  db.AsignacionRecorrido.belongsTo(db.Vehiculo, {
    foreignKey: {
      name: 'vehiculoIdVehi', // Nombre del campo FK en el modelo AsignacionRecorrido
      allowNull: false,
      field: 'vehiculo_id_vehi' // Nombre de la columna en la BD
    },
    as: 'vehiculo',      // Alias para la relación al hacer includes
    targetKey: 'idVehi'  // Columna PK en la tabla Vehiculo
  });
  db.Vehiculo.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'vehiculoIdVehi',
      allowNull: false,
      field: 'vehiculo_id_vehi'
    },
    as: 'asignaciones'
  });
}

if (db.AsignacionRecorrido && db.Usuario) {
  db.AsignacionRecorrido.belongsTo(db.Usuario, {
    foreignKey: {
      name: 'usuarioIdUsu',
      allowNull: false,
      field: 'usuario_id_usu'
    },
    as: 'conductor',
    targetKey: 'idUsu'
  });
  db.Usuario.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'usuarioIdUsu',
      allowNull: false,
      field: 'usuario_id_usu'
    },
    as: 'asignacionesComoConductor' // Alias para distinguir si Usuario tiene otras 'asignaciones'
  });
}

if (db.AsignacionRecorrido && db.Ruta) {
  db.AsignacionRecorrido.belongsTo(db.Ruta, {
    foreignKey: {
      name: 'rutaIdRuta',
      allowNull: false, // O true si una asignación puede no tener una ruta plantilla
      field: 'ruta_id_ruta'
    },
    as: 'rutaPlantilla',
    targetKey: 'idRuta'
  });
  db.Ruta.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'rutaIdRuta',
      allowNull: false,
      field: 'ruta_id_ruta'
    },
    as: 'asignacionesRecorrido'
  });
}


db.sequelize = sequelize; // La instancia de sequelize configurada
db.Sequelize = Sequelize; // La propia librería Sequelize (útil para acceder a Op, etc.)



module.exports = db; // Exporta el objeto db con todos los modelos y la instancia de sequelize
