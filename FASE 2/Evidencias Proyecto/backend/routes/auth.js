// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const router = express.Router();
const saltRounds = 10; // Factor de coste para bcrypt (10-12 es común)




// --- Ruta de Login ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validación básica
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        // 2. Buscar al usuario por email en la BD
        const user = await User.findOne({ where: { email: email } });

        // 3. Si no se encuentra el usuario, devolver error de autenticación
        if (!user) {
            // Usamos 401 Unauthorized (o 404 Not Found si prefieres no dar pistas)
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Comparar la contraseña enviada con el hash guardado en la BD
        // bcrypt.compare se encarga de hashear la contraseña enviada y compararla con el hash almacenado
        const isMatch = await bcrypt.compare(password, user.password);

        // 5. Si las contraseñas no coinciden, devolver error
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 6. ¡Las credenciales son válidas! Generar un JWT
      
      
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
            // Puedes añadir más datos si los necesitas (ej. name), pero mantenlo ligero.
        };

        // 7. Firmar el token usando el secreto del .env
        //    Establecemos una expiración (ej. '1h' para 1 hora, '7d' para 7 días)
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // El secreto debe estar definido en .env
            { expiresIn: '1h' } // Tiempo de vida del token
        );

        // 8. Enviar el token (y opcionalmente info básica del usuario) al cliente
        res.status(200).json({
            message: 'Login exitoso!',
            token: token, // El JWT generado
            user: { // Info útil para el frontend (sin password)
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
});

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body; // Obtener datos del body

    // 1. Validación básica de entrada
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }
    // Podrías añadir más validaciones (ej. longitud de contraseña)

    try {
        // 2. Verificar si el email ya existe
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado.' }); // 409 Conflict
        }

        // 3. Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Crear el nuevo usuario en la base de datos
        // Si 'role' no viene en req.body, usará el defaultValue del modelo ('driver')
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword, // Guardar la contraseña hasheada
            role: role // Permitir especificar rol al registrar (o quitarlo si quieres que siempre sea el default)
        });

        // 5. Responder con éxito (NO enviar la contraseña hasheada)
        // Creamos un objeto sin la contraseña para la respuesta
        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };
        res.status(201).json(userResponse); // 201 Created

    } catch (error) {
        console.error("Error en el registro:", error);
        // Manejar errores de validación de Sequelize (ej. email inválido si fallara isEmail)
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

module.exports = router; // Exportar el router