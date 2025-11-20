const express = require('express');
const router = express.Router();

// Importa únicamente la función que sí existe en el nuevo controlador
const { getProblems } = require('../controllers/zabbix');

// Define solo la ruta GET para obtener los problemas
router.get('/problems', getProblems);

module.exports = router;