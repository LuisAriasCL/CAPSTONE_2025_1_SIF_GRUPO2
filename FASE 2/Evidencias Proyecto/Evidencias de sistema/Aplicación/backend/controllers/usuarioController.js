// backend/controllers/usuarioController.js
const { Usuario } = require('../models');


exports.getUsuarios = async (req, res) => {
    try {
        const { rol } = req.query;
        
        let whereClause = {};
        if (rol) {
            whereClause.rol = rol;
        }

        const usuarios = await Usuario.findAll({
            where: whereClause,
            attributes: ['id_usu', 'pri_nom_usu', 'pri_ape_usu'], 
            raw: true 
        });

       
        const usuariosMapeados = usuarios.map(u => ({
            id_usu: u.id_usu,
            pri_nom_usu: u.pri_nom_usu,
            pri_ape_usu: u.pri_ape_usu
        }));
       

        res.status(200).json(usuariosMapeados);

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};