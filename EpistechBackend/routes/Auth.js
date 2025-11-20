const express = require('express');
const router = express.Router();
const { auth, logout } = require('../controllers/Auth'); // Ajusta la ruta según tu estructura
const verifyToken = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta
const checkInactivity = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// Ruta para autenticación de usuarios
router.post('/auth', auth);

// Ruta para cerrar sesión con verificación de token e inactividad
router.post('/logout', verifyToken, checkInactivity, logout);

module.exports = router;
