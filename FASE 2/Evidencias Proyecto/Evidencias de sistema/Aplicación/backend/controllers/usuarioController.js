// En backend/controllers/usuarioController.js
const { Usuario, AsignacionRecorrido, DetalleOt, OrdenTrabajo, RegistroCombustible } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // <-- AÑADIR ESTA LÍNEA
exports.getUsuarios = async (req, res) => {
    try {
      
        const { rol, estado } = req.query;
 
        let whereClause = { 
            estado_usu: estado || 'activo' 
        }; 
        
       
        if (rol && rol !== 'todos') { 
            whereClause.rol = rol;
        }

        const usuarios = await Usuario.findAll({
            where: whereClause,
      
            attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu', 'email', 'rol', 'estado_usu'],
            raw: true 
        });

   
        const usuariosMapeados = usuarios.map(u => ({
            id_usu: u.id_usu,
            pri_nom_usu: u.pri_nom_usu,
            pri_ape_usu: u.pri_ape_usu,
            email: u.email, 
            rol: u.rol,
            estado_usu: u.estado_usu
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

        // --- Verificación para cualquier rol involucrado en una OT activa ---
        const otActiva = await OrdenTrabajo.findOne({
            where: {
                [Op.or]: [
                    { usuarioIdUsuEncargado: id },
                    { usuarioIdUsuSolicitante: id }
                ],
                estado_ot: { [Op.notIn]: ['completada', 'cancelada'] }
            }
        });

        if (otActiva) {
            return res.status(409).json({ message: 'No se puede desactivar: El usuario está involucrado en una Orden de Trabajo activa (como solicitante o encargado).' });
        }


        // --- Verificaciones específicas por rol 

        // Validación para ROL CONDUCTOR en recorridos activos
        if (usuario.rol === 'conductor') {
            const asignacionActiva = await AsignacionRecorrido.findOne({
                where: {
                    usuarioIdUsuConductor: id,
                    estadoAsig: { [Op.notIn]: ['completado', 'cancelado'] }
                }
            });
            if (asignacionActiva) {
                return res.status(409).json({ message: 'No se puede desactivar: El conductor tiene un recorrido activo.' });
            }
        }

        // Validación para ROL TECNICO en tareas de OT activas
        if (usuario.rol === 'tecnico') {
            const detalleOtActivo = await DetalleOt.findOne({
                where: { usuarioIdUsuTecnico: id },
                include: [{
                    model: OrdenTrabajo,
                    required: true, 
                    where: {
                        estado_ot: { [Op.notIn]: ['completada', 'cancelada'] }
                    }
                }]
            });
            if (detalleOtActivo) {
                return res.status(409).json({ message: 'No se puede desactivar: El técnico está asignado a una OT activa.' });
            }
        }
        
        // --- ACCIÓN FINAL: SOFT DELETE ---
        await usuario.update({ estadoUsu: 'inactivo' });

        res.status(200).json({ message: 'Usuario desactivado exitosamente' });

    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.reactivateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Verifica si el usuario ya está activo para no hacer un update innecesario
        if (usuario.estadoUsu === 'activo') {
            return res.status(400).json({ message: 'El usuario ya se encuentra activo.' });
        }
        
        // Actualiza el estado a 'activo'
        await usuario.update({ estadoUsu: 'activo' });
        
        res.status(200).json({ message: 'Usuario reactivado exitosamente' });

    } catch (error) {
        console.error('Error al reactivar usuario:', error);
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

        const { pri_nom_usu, pri_ape_usu, email, rol, clave, rut_usu } = req.body;

       
        if (!pri_nom_usu || !pri_ape_usu || !email || !rol || !clave || !rut_usu) {
            return res.status(400).json({ message: 'Todos los campos son requeridos, incluyendo el RUT.' });
        }

        const hashedPassword = await bcrypt.hash(clave, 10);
        
        const nuevoUsuario = await Usuario.create({
            priNomUsu: pri_nom_usu,  
            priApeUsu: pri_ape_usu, 
          
            rutUsu: rut_usu,
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
            // Mensaje de error más específico
            const field = error.errors[0]?.path || 'desconocido';
            return res.status(409).json({ message: `El ${field} proporcionado ya está registrado.` });
        }
        
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message).join(', ');
            return res.status(400).json({ message: `Datos inválidos: ${messages}` });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
