// backend/routes/vehiculos.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize"); // Para filtros más complejos
const { Vehiculo, sequelize } = require("../models"); // Importa desde el index.js de la carpeta models
// const ExcelJS = require('exceljs'); // Descomenta si vas a implementar ExcelJS
// const PDFDocument = require('pdfkit'); // Descomenta si vas a implementar PDFKit u otra librería PDF

// GET /api/vehicles - Obtener vehículos PAGINADOS Y ORDENADOS
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sortBy = req.query.sortBy || "idVehi"; // Columna por defecto para ordenar
    const sortDirection = ["ASC", "DESC"].includes(
      req.query.sortDirection?.toUpperCase()
    )
      ? req.query.sortDirection.toUpperCase()
      : "ASC"; // Dirección por defecto

    // Aquí podrías añadir más filtros basados en req.query (ej. req.query.marca, req.query.estadoVehi)
    const filterConditions = {};
    if (req.query.patente) {
      filterConditions.patente = { [Op.like]: `%${req.query.patente}%` };
    }
    if (req.query.marca) {
      filterConditions.marca = { [Op.like]: `%${req.query.marca}%` };
    }
    if (req.query.modelo) {
      filterConditions.modelo = { [Op.like]: `%${req.query.modelo}%` };
    }
    if (req.query.estadoVehi) {
      filterConditions.estadoVehi = req.query.estadoVehi;
    }
    // Añade más filtros según necesites

    const offset = (page - 1) * pageSize;

    const { count, rows } = await Vehiculo.findAndCountAll({
      where: filterConditions, // Aplicar filtros
      limit: pageSize,
      offset: offset,
      order: [[sortBy, sortDirection]],
      // attributes: ['idVehi', 'patente', 'marca', 'modelo', 'anio', 'estadoVehi', 'kmVehi'] // Descomenta y ajusta para seleccionar solo los campos necesarios
    });

    res.status(200).json({
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error al obtener vehículos paginados:", err);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener vehículos." });
  }
});

// GET /api/vehicles/export - Exportar vehículos
router.get("/export", async (req, res) => {
  try {
    const format = req.query.format || "excel"; // 'excel' o 'pdf'
    const sortBy = req.query.sortBy || "idVehi";
    const sortDirection =
      req.query.sortDirection?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Reutilizar la lógica de filtros si es necesario
    const filterConditions = {};
    if (req.query.patente) {
      filterConditions.patente = { [Op.like]: `%${req.query.patente}%` };
    }
    if (req.query.marca) {
      filterConditions.marca = { [Op.like]: `%${req.query.marca}%` };
    }
    // ... otros filtros ...

    const vehiculos = await Vehiculo.findAll({
      where: filterConditions, // Aplicar filtros si es necesario
      order: [[sortBy, sortDirection]],
    });

    if (format === "excel") {
      // Lógica para generar Excel (usando librerías como exceljs)
      // const workbook = new ExcelJS.Workbook();
      // const worksheet = workbook.addWorksheet('Vehiculos');
      // worksheet.columns = [ // Define tus columnas
      //   { header: 'ID', key: 'idVehi', width: 10 },
      //   { header: 'Patente', key: 'patente', width: 15 },
      //   { header: 'Marca', key: 'marca', width: 20 },
      //   { header: 'Modelo', key: 'modelo', width: 20 },
      //   { header: 'Año', key: 'anio', width: 10 },
      //   { header: 'Kilometraje', key: 'kmVehi', width: 15 },
      //   { header: 'Estado', key: 'estadoVehi', width: 15 },
      //   // ... más columnas según tu modelo Vehiculo
      // ];
      // worksheet.addRows(vehiculos.map(v => v.toJSON())); // Asegúrate que los datos sean planos

      // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // res.setHeader('Content-Disposition', 'attachment; filename="vehiculos.xlsx"');
      // await workbook.xlsx.write(res);
      // return res.end();
      console.log("Generando Excel para:", vehiculos.length, "vehículos");
      return res
        .status(501)
        .json({
          message:
            "Exportación a Excel no implementada completamente en este ejemplo. Revisa la consola del backend para ver los datos.",
        });
    } else if (format === "pdf") {
      // Lógica para generar PDF (usando librerías como pdfkit o puppeteer)
      // Ejemplo con pdfkit (muy básico):
      // const doc = new PDFDocument();
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', 'attachment; filename="vehiculos.pdf"');
      // doc.pipe(res);
      // doc.fontSize(12);
      // vehiculos.forEach(v => {
      //   doc.text(`Patente: ${v.patente}, Marca: ${v.marca}, Modelo: ${v.modelo}`);
      // });
      // doc.end();
      // return;
      console.log("Generando PDF para:", vehiculos.length, "vehículos");
      return res
        .status(501)
        .json({
          message:
            "Exportación a PDF no implementada completamente en este ejemplo. Revisa la consola del backend para ver los datos.",
        });
    } else {
      return res
        .status(400)
        .json({ message: "Formato de exportación no soportado." });
    }
  } catch (err) {
    console.error(`Error al exportar vehículos a ${req.query.format}:`, err);
    res
      .status(500)
      .json({ message: "Error interno del servidor al exportar vehículos." });
  }
});

// GET /api/vehicles/:idVehi - Obtener UN vehículo por su ID
router.get("/:idVehi", async (req, res) => {
  try {
    const idVehiParam = parseInt(req.params.idVehi, 10);
    if (isNaN(idVehiParam)) {
      return res
        .status(400)
        .json({ message: "El ID del vehículo debe ser un número." });
    }
    const vehiculo = await Vehiculo.findByPk(idVehiParam);
    if (!vehiculo) {
      return res.status(404).json({ message: "Vehículo no encontrado." });
    }
    res.status(200).json(vehiculo);
  } catch (err) {
    console.error(`Error al obtener vehículo ${req.params.idVehi}:`, err);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener el vehículo." });
  }
});

// POST /api/vehicles - Crear un NUEVO vehículo
router.post("/", async (req, res) => {
  try {
    const nuevoVehiculo = await Vehiculo.create(req.body);
    if (req.io) {
      req.io.emit("vehicleCreated", nuevoVehiculo.toJSON());
    }
    res.status(201).json(nuevoVehiculo);
  } catch (err) {
    console.error("Error al crear vehículo:", err);
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        message: "Error de validación o restricción.",
        errors: err.errors.map((e) => e.message),
      });
    }
    res
      .status(500)
      .json({ message: "Error interno del servidor al crear el vehículo." });
  }
});

// PUT /api/vehicles/:idVehi - Actualizar UN vehículo existente
router.put("/:idVehi", async (req, res) => {
  try {
    const idVehiParam = parseInt(req.params.idVehi, 10);
    if (isNaN(idVehiParam)) {
      return res
        .status(400)
        .json({ message: "El ID del vehículo debe ser un número." });
    }
    const vehiculo = await Vehiculo.findByPk(idVehiParam);
    if (!vehiculo) {
      return res
        .status(404)
        .json({ message: "Vehículo no encontrado para actualizar." });
    }
    await vehiculo.update(req.body);
    if (req.io) {
      req.io.emit("vehicleUpdated", vehiculo.toJSON());
    }
    res.status(200).json(vehiculo);
  } catch (err) {
    console.error(`Error al actualizar vehículo ${req.params.idVehi}:`, err);
    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        message: "Error de validación o restricción.",
        errors: err.errors.map((e) => e.message),
      });
    }
    res.status(500).json({
      message: "Error interno del servidor al actualizar el vehículo.",
    });
  }
});

// DELETE /api/vehicles/:idVehi - Eliminar UN vehículo existente
router.delete("/:idVehi", async (req, res) => {
  try {
    const idVehiParam = parseInt(req.params.idVehi, 10);
    if (isNaN(idVehiParam)) {
      return res
        .status(400)
        .json({ message: "El ID del vehículo debe ser un número." });
    }
    const numeroFilasEliminadas = await Vehiculo.destroy({
      where: { idVehi: idVehiParam },
    });
    if (numeroFilasEliminadas === 0) {
      return res
        .status(404)
        .json({ message: "Vehículo no encontrado para eliminar." });
    }
    if (req.io) {
      req.io.emit("vehicleDeleted", { id: idVehiParam });
    }
    res.status(200).json({ message: "Vehículo eliminado exitosamente." });
  } catch (err) {
    console.error(`Error al eliminar vehículo ${req.params.idVehi}:`, err);
    res
      .status(500)
      .json({ message: "Error interno del servidor al eliminar el vehículo." });
  }
});

module.exports = router;
