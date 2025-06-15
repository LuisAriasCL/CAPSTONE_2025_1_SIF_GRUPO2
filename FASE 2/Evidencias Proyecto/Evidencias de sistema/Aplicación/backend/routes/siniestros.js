// backend/routes/siniestros.js

const express = require('express');
const router = express.Router();
const siniestroController = require('../controllers/siniestroController');

router.post('/', siniestroController.uploadFile, siniestroController.createSiniestro);

module.exports = router;