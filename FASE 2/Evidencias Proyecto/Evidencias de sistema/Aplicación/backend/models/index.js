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

// --- ASOCIACIONES EXISTENTES ---
if (db.Siniestro && db.Usuario && db.Vehiculo) {

    // Un siniestro es reportado por un Usuario (conductor)
    db.Siniestro.belongsTo(db.Usuario, {
        foreignKey: {
            name: 'conductorId',
            field: 'usuario_id_usu_conductor', // Nombre exacto de la columna en tu SQL
            allowNull: false
        },
        as: 'conductor'
    });
    db.Usuario.hasMany(db.Siniestro, {
        foreignKey: 'usuario_id_usu_conductor',
        as: 'siniestrosComoConductor'
    });

    // Un siniestro también tiene un usuario que reporta (puede ser el mismo o no)
    db.Siniestro.belongsTo(db.Usuario, {
        foreignKey: {
            name: 'reportaId',
            field: 'usuario_id_usu_reporta', // Nombre exacto de la columna en tu SQL
            allowNull: false
        },
        as: 'reporta'
    });

    // Un siniestro pertenece a un Vehiculo
    db.Siniestro.belongsTo(db.Vehiculo, {
        foreignKey: {
            name: 'vehiculoId',
            field: 'vehiculo_id_vehi', // Nombre exacto de la columna en tu SQL
            allowNull: false
        },
        as: 'vehiculo'
    });
    db.Vehiculo.hasMany(db.Siniestro, {
        foreignKey: 'vehiculo_id_vehi',
        as: 'siniestros'
    });
}
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
    targetKey: 'idRuta' 
  });
  db.Ruta.hasMany(db.AsignacionRecorrido, {
    foreignKey: {
      name: 'rutaIdRuta',
      allowNull: false,
      field: 'ruta_id_ruta'
    },
    as: 'asignacionesEnEstaRuta' 
  });
}

// --- ASOCIACIONES DE PLANIFICACIÓN DE MANTENIMIENTO ---

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

// --- ASOCIACIONES PARA ORDEN DE TRABAJO (OT) Y DETALLE OT ---

// Relación: OrdenTrabajo (1) <--> DetalleOt (N)
if (db.OrdenTrabajo && db.DetalleOt) {
  db.OrdenTrabajo.hasMany(db.DetalleOt, {
    foreignKey: { name: 'ordenTrabajoIdOt', field: 'orden_trabajo_id_ot', allowNull: false },
    as: 'detalles'
  });
  db.DetalleOt.belongsTo(db.OrdenTrabajo, {
    foreignKey: { name: 'ordenTrabajoIdOt', field: 'orden_trabajo_id_ot', allowNull: false }
  });
}

// Relación: OrdenTrabajo (N) <--> Vehiculo (1)
if (db.OrdenTrabajo && db.Vehiculo) {
  db.Vehiculo.hasMany(db.OrdenTrabajo, {
    foreignKey: { name: 'vehiculoIdVehi', field: 'vehiculo_id_vehi', allowNull: false }
  });
  db.OrdenTrabajo.belongsTo(db.Vehiculo, {
    foreignKey: { name: 'vehiculoIdVehi', field: 'vehiculo_id_vehi', allowNull: false },
    as: 'vehiculo'
  });
}

// Relación: OrdenTrabajo con Usuarios (Solicitante y Encargado)
if (db.OrdenTrabajo && db.Usuario) {
  db.OrdenTrabajo.belongsTo(db.Usuario, {
    foreignKey: { name: 'usuarioIdUsuSolicitante', field: 'usuario_id_usu_solicitante' },
    as: 'solicitante'
  });
  db.OrdenTrabajo.belongsTo(db.Usuario, {
    foreignKey: { name: 'usuarioIdUsuEncargado', field: 'usuario_id_usu_encargado' },
    as: 'encargado'
  });
}

// Relación: DetalleOt con Usuario (Técnico asignado)
if (db.DetalleOt && db.Usuario) {
    // Una tarea (DetalleOt) pertenece a un usuario (el técnico)
    db.DetalleOt.belongsTo(db.Usuario, {
        foreignKey: { name: 'usuarioIdUsuTecnico', field: 'usuario_id_usu_tecnico' },
        as: 'tecnico'
    });
    // Y la relación inversa: Un usuario (técnico) puede tener muchas tareas
    db.Usuario.hasMany(db.DetalleOt, {
        foreignKey: { name: 'usuarioIdUsuTecnico', field: 'usuario_id_usu_tecnico' },
        as: 'tareasAsignadas' 
    });
}

// Relación: OrdenTrabajo <--> VehiculoPlanificacion
if (db.OrdenTrabajo && db.VehiculoPlanificacion) {
    db.OrdenTrabajo.belongsTo(db.VehiculoPlanificacion, {
        foreignKey: { name: 'vehiculoPlanificacionVehiculoIdVehi', field: 'vehiculo_planificacion_vehiculo_id_vehi' },
        as: 'planificacionVehiculo'
    });
     db.OrdenTrabajo.belongsTo(db.VehiculoPlanificacion, {
        foreignKey: { name: 'vehiculoPlanificacionPlanIdPlan', field: 'vehiculo_planificacion_plan_id_plan' },
        as: 'planificacionMantenimiento'
    });
}

// Relación (Opcional): DetalleOt <--> Tarea (Catálogo general)
if (db.DetalleOt && db.Tarea) {
    db.DetalleOt.belongsTo(db.Tarea, {
        foreignKey: { name: 'tareaIdTarea', field: 'tarea_id_tarea' },
        as: 'tareaEstandar'
    });
}
// --- NUEVAS ASOCIACIONES PARA REGISTRO DE COMBUSTIBLE ---
if (db.RegistroCombustible && db.Vehiculo) {
  // Un registro de combustible pertenece a un vehículo
  db.RegistroCombustible.belongsTo(db.Vehiculo, { foreignKey: 'vehiculoId' });
  db.Vehiculo.hasMany(db.RegistroCombustible, { foreignKey: 'vehiculoId' });
}

if (db.RegistroCombustible && db.Usuario) {
  // Un registro de combustible es realizado por un usuario (conductor)
  db.RegistroCombustible.belongsTo(db.Usuario, { foreignKey: 'usuarioId' });
  db.Usuario.hasMany(db.RegistroCombustible, { foreignKey: 'usuarioId' });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;