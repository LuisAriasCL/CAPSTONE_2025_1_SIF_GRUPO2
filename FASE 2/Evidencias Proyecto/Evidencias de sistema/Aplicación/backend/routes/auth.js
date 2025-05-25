// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); // <-- CAMBIO: Importar Usuario
const router = express.Router();
const saltRounds = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    // Esperamos que el frontend envíe los campos con los nombres como en el DDL/BD (ej. pri_nom_usu)
    const {
        pri_nom_usu, pri_ape_usu, email, clave, // Principales de tu DDL
        seg_nom_usu, seg_ape_usu, rut_usu, celular,
        fec_emi_lic, fec_ven_lic, tipo_lic, archivo_url_lic, rol
    } = req.body;

    if (!pri_nom_usu || !pri_ape_usu || !email || !clave) {
        return res.status(400).json({ message: 'Nombre, apellido, email y clave son requeridos.' });
    }

    try {
        // Buscamos por email (campo del modelo es 'email')
        const existingUser = await Usuario.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        if (rut_usu) {
            const existingRut = await Usuario.findOne({ where: { rutUsu: rut_usu } }); // Campo del modelo es 'rutUsu'
            if (existingRut) {
                return res.status(409).json({ message: 'El RUT ya está registrado.' });
            }
        }

        const hashedPassword = await bcrypt.hash(clave, saltRounds);

        // Creamos usando los campos del modelo Sequelize (camelCase)
        const newUser = await Usuario.create({
            priNomUsu: pri_nom_usu, // Mapeo de req.body.pri_nom_usu a modelo.priNomUsu
            segNomUsu: seg_nom_usu,
            priApeUsu: pri_ape_usu,
            segApeUsu: seg_ape_usu,
            email: email,
            celular: celular,
            rutUsu: rut_usu,
            fecEmiLic: fec_emi_lic,
            fecVenLic: fec_ven_lic,
            tipoLic: tipo_lic,
            archivoUrlLic: archivo_url_lic,
            rol: rol || 'conductor',
            clave: hashedPassword // El modelo usa 'clave' para la columna de la BD
        });

        // Devolvemos los nombres de campo del modelo
        const userResponse = {
            idUsu: newUser.idUsu,
            priNomUsu: newUser.priNomUsu,
            email: newUser.email,
            rol: newUser.rol
        };
        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error en el registro:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: error.errors.map(e => e.message) });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ message: 'Error de restricción única (email o rut ya existen).', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, clave } = req.body; // Frontend envía 'clave'

    if (!email || !clave) {
        return res.status(400).json({ message: 'Email y clave son requeridos.' });
    }

    try {
        // Buscamos por email (campo del modelo 'email')
        const user = await Usuario.findOne({ where: { email: email } });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Comparamos con el campo 'clave' del modelo
        const isMatch = await bcrypt.compare(clave, user.clave);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Usamos campos del modelo para el payload y la respuesta
        const payload = {
            userId: user.idUsu, // Campo 'idUsu' del modelo
            email: user.email,
            role: user.rol,
            nombre: user.priNomUsu // Ejemplo de añadir nombre al payload
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login exitoso!',
            token: token,
            user: {
                idUsu: user.idUsu,
                priNomUsu: user.priNomUsu,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
});

module.exports = router;