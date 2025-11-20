const express = require('express');
const router = express.Router();
const DisponiblesController = require('../controllers/Disponibles');

// GET todos los registros
router.get('/', DisponiblesController.obtenerDisponibles);

//CREAR 
router.post('/', DisponiblesController.crearDisponible);

// PUT actualizar uno
router.put('/:id', DisponiblesController.actualizarDisponible);

// DELETE eliminar uno
router.delete('/:id', DisponiblesController.eliminarDisponible);



module.exports = router;
