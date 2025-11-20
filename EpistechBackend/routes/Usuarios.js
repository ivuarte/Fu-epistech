const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/Usuarios');



// Ruta para crear un nuevo usuario
router.post('/create',  UsuariosController.createUser);
//Ruta Cambiar estado inactivo 
router.put('/cambiarEstado/:id',  UsuariosController.cambiarEstado);
//Ruta cambiar contraseña
router.put('/cambiarContrasena/:id',  UsuariosController.cambiarContrasena);
// Ruta para obtener todos los usuarios
router.get('/todos',  UsuariosController.getTodosUsuarios);
// Ruta para obtener usuarios disponibles para la matriz RACI
router.get('/disponibles', UsuariosController.getUsuariosDisponibles);

module.exports = router;


