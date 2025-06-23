// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const router = express.Router();


const { Usuario } = require('../models'); 

const saltRounds = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
 
    const {
        pri_nom_usu, seg_nom_usu, pri_ape_usu, seg_ape_usu,
        email, clave, rut_usu, celular,
        fec_emi_lic, fec_ven_lic, tipo_lic, archivo_url_lic, rol
    } = req.body;

    if (!pri_nom_usu || !pri_ape_usu || !email || !clave) {
        return res.status(400).json({ message: 'Nombre, apellido, email y clave son requeridos.' });
    }

    try {
        const existingUserByEmail = await Usuario.findOne({ where: { email: email } });
        if (existingUserByEmail) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        if (rut_usu) { // rutUsu es el campo en el modelo Sequelize
            const existingUserByRut = await Usuario.findOne({ where: { rutUsu: rut_usu } });
            if (existingUserByRut) {
                return res.status(409).json({ message: 'El RUT ya está registrado.' });
            }
        }

        const hashedPassword = await bcrypt.hash(clave, saltRounds);

        // Usar los nombres de campo camelCase del modelo Sequelize al crear
        const newUser = await Usuario.create({
            priNomUsu: pri_nom_usu,
            segNomUsu: seg_nom_usu,
            priApeUsu: pri_ape_usu,
            segApeUsu: seg_ape_usu,
            email: email,
            celular: celular,
            rutUsu: rut_usu,
            fecEmiLic: fec_emi_lic ? new Date(fec_emi_lic) : null, 
            fecVenLic: fec_ven_lic ? new Date(fec_ven_lic) : null, 
            tipoLic: tipo_lic,
            archivoUrlLic: archivo_url_lic,
            rol: rol || 'conductor', 
            clave: hashedPassword
        });

      
        const userResponse = {
            idUsu: newUser.idUsu,
            priNomUsu: newUser.priNomUsu,
            priApeUsu: newUser.priApeUsu, 
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
             return res.status(409).json({ message: 'Error: El email o RUT ya existe.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, clave } = req.body; 

  if (!email || !clave) {
    return res.status(400).json({ message: 'Email y clave son requeridos.' });
  }

  try {
    const user = await Usuario.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(clave, user.clave);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    
    if (user.estadoUsu !== 'activo') {
      return res.status(403).json({ message: 'Su cuenta ha sido desactivada. Por favor, contacte al administrador.' });
    }

    // --- CORRECCIÓN EN EL PAYLOAD DEL TOKEN ---
    // Usamos los nombres camelCase del objeto 'user' de Sequelize
    const payload = {
      id_usu: user.idUsu, // <--- CAMBIO AQUÍ
      email: user.email,
      rol: user.rol,
      nombre: user.priNomUsu // <--- CAMBIO AQUÍ
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'tu_secreto_jwt_por_defecto', { expiresIn: '24h' });

    // --- CORRECCIÓN EN LA RESPUESTA JSON ---
    // Creamos el objeto 'user' para el frontend, usando los nombres que el frontend espera
    // (en este caso, snake_case, porque tu 'mapUser' en el frontend los espera así)
    res.status(200).json({
      message: 'Login exitoso!',
      token: token,
      user: {
        id_usu: user.idUsu,          // <--- CAMBIO AQUÍ
        pri_nom_usu: user.priNomUsu, // <--- CAMBIO AQUÍ
        pri_ape_usu: user.priApeUsu, // <--- CAMBIO AQUÍ
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: 'Error interno del servidor durante el login.' });
  }
});
// GET /api/auth/users - Para listar usuarios (ej. para selectores de conductor)
router.get('/users', async (req, res) => {
    try {
        const { rol } = req.query;
        
        // --- CAMBIO 2: FILTRAR SIEMPRE POR USUARIOS ACTIVOS ---
        const whereClause = { estado_usu: 'activo' };
        if (rol) {
            whereClause.rol = rol;
        }
        // --- FIN DEL CAMBIO 2 ---

        const usuarios = await Usuario.findAll({
            where: whereClause,
            attributes: ['id_usu', 'pri_nom_usu', 'seg_nom_usu', 'pri_ape_usu', 'seg_ape_usu', 'email', 'rol']
        });
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de usuarios.' });
    }
});


module.exports = router;
