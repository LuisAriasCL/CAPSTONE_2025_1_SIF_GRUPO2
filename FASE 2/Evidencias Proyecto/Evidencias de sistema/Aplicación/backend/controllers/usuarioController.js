// En backend/controllers/usuarioController.js
const { Usuario, AsignacionRecorrido, DetalleOt, OrdenTrabajo, RegistroCombustible } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // <-- AÑADIR ESTA LÍNEA
exports.getUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        
        // --- CAMBIO 1: Asegurar que solo se obtengan usuarios activos ---
        let whereClause = { estado_usu: 'activo' }; 
        if (rol) {
            whereClause.rol = rol;
        }

        const usuarios = await Usuario.findAll({
            where: whereClause,
            // --- CAMBIO 2: Incluir el campo 'estado_usu' en los atributos ---
            attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu', 'email', 'rol', 'estado_usu'],
            raw: true 
        });

        
        const usuariosMapeados = usuarios.map(u => ({
            id_usu: u.id_usu,
            pri_nom_usu: u.pri_nom_usu,
            pri_ape_usu: u.pri_ape_usu,
            email: u.email, 
            rol: u.rol,
            estado_usu: u.estado_usu // Devolver también el estado
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

        // Validación para ROL CONDUCTOR
        if (usuario.rol === 'conductor') {
            const asignacionActiva = await AsignacionRecorrido.findOne({
                where: {
                    // --- CORRECCIÓN ---
                    // El modelo AsignacionRecorrido.js usa 'usuarioIdUsuConductor' como propiedad.
                    // En este caso, tu código original era correcto para este modelo específico.
                    usuarioIdUsuConductor: id,
                    estadoAsig: { [Op.notIn]: ['completado', 'cancelado'] }
                }
            });
            if (asignacionActiva) {
                return res.status(409).json({ message: 'No se puede desactivar: El conductor tiene un recorrido activo.' });
            }
        }

        // Validación para ROL TECNICO
        if (usuario.rol === 'tecnico') {
            const detalleOtActivo = await DetalleOt.findOne({
                where: {
                    // --- CORRECCIÓN ---
                    // El modelo DetalleOt.js define la clave foránea como 'usuarioIdUsuTecnico'.
                    // Tu código original era correcto aquí también.
                    usuarioIdUsuTecnico: id 
                },
                include: [{
                    model: OrdenTrabajo,
                    required: true, 
                    where: {
                        // --- CORRECCIÓN DE TIPO ---
                        // El estado en la BD es 'completada' (femenino).
                        estado_ot: { [Op.notIn]: ['completado', 'cancelado'] }
                    }
                }]
            });
            if (detalleOtActivo) {
                return res.status(409).json({ message: 'No se puede desactivar: El técnico tiene una OT activa.' });
            }
        }
        
        // Validación para ROL ENCARGADO
        const otEncargadoActiva = await OrdenTrabajo.findOne({
            where: {
                // --- CORRECCIÓN ---
                // El modelo OrdenTrabajo.js define la propiedad como 'usuarioIdUsuEncargado'.
                // Tu código original estaba correcto. La corrección de estado era la clave.
                usuarioIdUsuEncargado: id,
                estado_ot: { [Op.notIn]: ['completado', 'cancelado'] }
            }
        });
        if(otEncargadoActiva) {
            return res.status(409).json({ message: 'No se puede desactivar: El usuario es encargado de una OT activa.' });
        }

        // --- ACCIÓN FINAL: SOFT DELETE ---
        // Ahora que todas las validaciones se ejecutan correctamente, procedemos a desactivar.
        await usuario.update({ estadoUsu: 'inactivo' });

        res.status(200).json({ message: 'Usuario desactivado exitosamente' });

    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        // Este error de FK ya no debería ocurrir, pero lo dejamos por si acaso.
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'No se puede desactivar. El usuario tiene registros históricos asociados.' });
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
        // --- CAMBIO 1: Añadir 'rut_usu' a la desestructuración ---
        const { pri_nom_usu, pri_ape_usu, email, rol, clave, rut_usu } = req.body;

        // --- CAMBIO 2: Añadir 'rut_usu' a la validación ---
        if (!pri_nom_usu || !pri_ape_usu || !email || !rol || !clave || !rut_usu) {
            return res.status(400).json({ message: 'Todos los campos son requeridos, incluyendo el RUT.' });
        }

        const hashedPassword = await bcrypt.hash(clave, 10);
        
        const nuevoUsuario = await Usuario.create({
            priNomUsu: pri_nom_usu,  
            priApeUsu: pri_ape_usu, 
            // --- CAMBIO 3: Añadir 'rutUsu' al objeto de creación ---
            rutUsu: rut_usu,
            email: email,
            rol: rol,
            clave: hashedPassword
            // No es necesario añadir 'estado_usu', se establece por defecto.
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
