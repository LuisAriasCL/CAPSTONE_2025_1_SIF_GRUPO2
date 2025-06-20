// backend/routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');


router.get('/', usuarioController.getUsuarios);

router.get('/', usuarioController.getUsuarios);
router.put('/:id', usuarioController.updateUsuario);

router.delete('/:id', usuarioController.deleteUsuario);
router.post('/', usuarioController.createUsuario);
module.exports = router;