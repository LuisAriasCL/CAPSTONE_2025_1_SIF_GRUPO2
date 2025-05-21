
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');
const router = express.Router();
const saltRounds = 10; 




// --- Ruta de Login ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Validación básica
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
       
        const user = await User.findOne({ where: { email: email } });

        
        if (!user) {
           
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);

       
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

      
      
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
           
        };

        
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );

       
        res.status(200).json({
            message: 'Login exitoso!',
            token: token, 
            user: { 
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
    const { name, email, password, role } = req.body; 

    // 1. Validación básica de entrada
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }
   

    try {
       
        const existingUser = await User.findOne({ where: { email: email } });
        if (existingUser) {
            return res.status(409).json({ message: 'El email ya está registrado.' }); // 409 Conflict
        }

        
        const hashedPassword = await bcrypt.hash(password, saltRounds);

       
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword, 
            role: role 
        });

       
        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };
        res.status(201).json(userResponse); 

    } catch (error) {
        console.error("Error en el registro:", error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

module.exports = router; 