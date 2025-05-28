// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const sequelize = require('../config/database'); 
const db = {};


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
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Almacena el modelo en el objeto db usando su nombre
  });


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
  
  }
});



// Modelo: AsignacionRecorrido
if (db.AsignacionRecorrido && db.Vehiculo) {
  db.AsignacionRecorrido.belongsTo(db.Vehiculo, {
    foreignKey: {
      name: 'vehiculoIdVehi',
      allowNull: false,
      field: 'vehiculo_id_vehi'
    },
    as: 'vehiculo',
    targetKey: 'idVehi' 
  });
  db.Vehiculo.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'vehiculoIdVehi',
      allowNull: false,
      field: 'vehiculo_id_vehi'
    },
    as: 'recorridosAsignados' 
  });
}

if (db.AsignacionRecorrido && db.Usuario) {
  db.AsignacionRecorrido.belongsTo(db.Usuario, {
    foreignKey: {
      name: 'usuarioIdUsuConductor', 
      field: 'usuario_id_usu', 
      allowNull: false 
    },
    as: 'conductor',
    targetKey: 'idUsu' 
  });
  db.Usuario.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'usuarioIdUsuConductor',
      field: 'usuario_id_usu', 
      allowNull: false
    },
    as: 'asignacionesComoConductor'
  });
}

if (db.AsignacionRecorrido && db.Ruta) {
  db.AsignacionRecorrido.belongsTo(db.Ruta, {
    foreignKey: {
      name: 'rutaIdRuta',
      allowNull: false,
      field: 'ruta_id_ruta'
    },
    as: 'rutaPlantilla',
    targetKey: 'idRuta' // Asegúrate que 'idRuta' es la PK en tu modelo Ruta
  });
  db.Ruta.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'rutaIdRuta',
      allowNull: false,
      field: 'ruta_id_ruta'
    },
    as: 'asignacionesEnEstaRuta' // CAMBIADO para mayor claridad y unicidad
  });
}

// --- NUEVAS ASOCIACIONES DE MANTENIMIENTO ---


if (db.PlanificacionMantenimiento && db.TareaPlanificacion) {
  db.PlanificacionMantenimiento.hasMany(db.TareaPlanificacion, {
    foreignKey: {
      name: 'planificacionMantenimientoIdPlan', 
      field: 'planificacion_mantenimiento_id_plan', 
      allowNull: false
    },
    as: 'tareas' 
  });

  db.TareaPlanificacion.belongsTo(db.PlanificacionMantenimiento, {
    foreignKey: {
      name: 'planificacionMantenimientoIdPlan',
      field: 'planificacion_mantenimiento_id_plan',
      allowNull: false
    }
 
  });
} else {
 
  if (!db.PlanificacionMantenimiento) console.error("ERROR en index.js: Modelo PlanificacionMantenimiento no encontrado en db.");
  if (!db.TareaPlanificacion) console.error("ERROR en index.js: Modelo TareaPlanificacion no encontrado en db.");
}


if (db.PlanificacionMantenimiento && db.Vehiculo && db.VehiculoPlanificacion) {
  db.PlanificacionMantenimiento.belongsToMany(db.Vehiculo, {
    through: db.VehiculoPlanificacion, 
    foreignKey: {
        name: 'planificacionMantenimientoIdPlan',
        field: 'planificacion_mantenimiento_id_plan',
        allowNull: false
    },
    otherKey: {
        name: 'vehiculoIdVehi',
        field: 'vehiculo_id_vehi',
        allowNull: false
    },
    as: 'vehiculosEnPlan' 
  });

  db.Vehiculo.belongsToMany(db.PlanificacionMantenimiento, {
    through: db.VehiculoPlanificacion,
    foreignKey: {
        name: 'vehiculoIdVehi',
        field: 'vehiculo_id_vehi',
        allowNull: false
    },
    otherKey: {
        name: 'planificacionMantenimientoIdPlan',
        field: 'planificacion_mantenimiento_id_plan',
        allowNull: false
    },
    as: 'planificacionesDelVehiculo' 
  });
} else {
  if (!db.PlanificacionMantenimiento) console.error("ERROR en index.js: Modelo PlanificacionMantenimiento no encontrado en db (para relación con Vehiculo).");
  if (!db.Vehiculo) console.error("ERROR en index.js: Modelo Vehiculo no encontrado en db (para relación con PlanificacionMantenimiento).");
  if (!db.VehiculoPlanificacion) console.error("ERROR en index.js: Modelo VehiculoPlanificacion no encontrado en db.");
}



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;