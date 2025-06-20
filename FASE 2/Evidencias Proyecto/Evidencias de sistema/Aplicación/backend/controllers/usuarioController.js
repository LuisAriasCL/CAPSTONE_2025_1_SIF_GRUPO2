// En backend/controllers/usuarioController.js
const { Usuario, AsignacionRecorrido, DetalleOt, OrdenTrabajo, RegistroCombustible } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); 
exports.getUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        
        let whereClause = {};
        if (rol) {
            whereClause.rol = rol;
        }

        const usuarios = await Usuario.findAll({
            where: whereClause,
            attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu', 'email', 
                'rol'], 
            raw: true 
        });

       
        const usuariosMapeados = usuarios.map(u => ({
            id_usu: u.id_usu,
            pri_nom_usu: u.pri_nom_usu,
            pri_ape_usu: u.pri_ape_usu,
            email: u.email, 
            rol: u.rol  
        }));
       

        res.status(200).json(usuariosMapeados);

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

      


        if (usuario.rol === 'conductor') {
            const asignacionActiva = await AsignacionRecorrido.findOne({
                where: {
                    usuarioIdUsuConductor: id,
                    estadoAsig: {
                        [Op.notIn]: ['completado', 'cancelado'] 
                    }
                }
            });
            if (asignacionActiva) {
                return res.status(409).json({ message: 'No se puede eliminar: El conductor está asignado a un recorrido que aún está activo o pendiente.' });
            }
        }

       
        if (usuario.rol === 'tecnico') {
          
            const detalleOtActivo = await DetalleOt.findOne({
                where: { usuarioIdUsuTecnico: id },
                include: [{
                    model: OrdenTrabajo,
                    required: true, 
                    where: {
                        estado_ot: {
                            [Op.notIn]: ['completado', 'cancelado']
                        }
                    }
                }]
            });
            if (detalleOtActivo) {
                return res.status(409).json({ message: 'No se puede eliminar: El técnico está asignado a una Orden de Trabajo que aún está activa.' });
            }
        }
        
       
        const otEncargadoActiva = await OrdenTrabajo.findOne({
            where: {
                usuarioIdUsuEncargado: id,
                estado_ot: { [Op.notIn]: ['completada', 'cancelada'] }
            }
        });
        if(otEncargadoActiva) {
            return res.status(409).json({ message: 'No se puede eliminar: El usuario es el encargado de una Orden de Trabajo activa.' });
        }


    
        await usuario.destroy();

        res.status(200).json({ message: 'Usuario eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar usuario:', error.name, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'No se puede eliminar. El usuario está siendo utilizado en otra parte del sistema (posiblemente registros históricos).' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const incomingData = req.body; 

        console.log(`[DEBUG] Petición PUT recibida para el usuario ID: ${id}`);
        console.log('[DEBUG] Datos recibidos en el body:', incomingData);

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log('[DEBUG] Usuario encontrado. Datos ANTES:', usuario.toJSON());

        const dataToUpdate = {
            priNomUsu: incomingData.pri_nom_usu,
            priApeUsu: incomingData.pri_ape_usu,
            email: incomingData.email,
            rol: incomingData.rol
        };

       
        await usuario.update(dataToUpdate);

        console.log('[DEBUG] Usuario actualizado. Datos DESPUÉS:', usuario.toJSON());

     
        res.status(200).json(usuario);

    } catch (error) {
        console.error('[DEBUG] CATCH: Error durante la actualización:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Datos inválidos', errors });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.createUsuario = async (req, res) => {
    try {
    
        const { pri_nom_usu, pri_ape_usu, email, rol, clave } = req.body;

        if (!pri_nom_usu || !pri_ape_usu || !email || !rol || !clave) {
            return res.status(400).json({ message: 'Todos los campos son requeridos.' });
        }

        const hashedPassword = await bcrypt.hash(clave, 10);

       
        const nuevoUsuario = await Usuario.create({
            priNomUsu: pri_nom_usu,   
            priApeUsu: pri_ape_usu, 
            email: email,
            rol: rol,
            clave: hashedPassword
          
        });

        const usuarioParaDevolver = { ...nuevoUsuario.toJSON() };
        delete usuarioParaDevolver.clave;

        res.status(201).json(usuarioParaDevolver);

    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El email proporcionado ya está registrado.' });
        }
       
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message).join(', ');
            return res.status(400).json({ message: `Datos inválidos: ${messages}` });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};