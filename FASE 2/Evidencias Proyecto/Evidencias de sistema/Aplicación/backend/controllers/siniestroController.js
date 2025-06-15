// backend/controllers/siniestroController.js

const { Siniestro } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads/siniestros');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });
exports.uploadFile = upload.single('fotoIncidente'); 

exports.createSiniestro = async (req, res) => {
  try {
    const { vehiculoId, conductorId, fecha, tipo, descripcion } = req.body;
    
    let archivoUrl = null;
    if (req.file) {
      archivoUrl = `/uploads/siniestros/${req.file.filename}`;
    }

    const nuevoSiniestro = await Siniestro.create({
      vehiculoId,
      conductorId,       
      reportaId: conductorId, 
      fecha,
      tipo,
      descripcion,
      archivoUrl
    });

    res.status(201).json(nuevoSiniestro);
  } catch (error) {
    console.error('Error al crear siniestro:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};