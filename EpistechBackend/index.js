const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Habilitar CORS
app.use(cors());

// Permitir leer datos JSON en el cuerpo de las solicitudes
app.use(express.json());

// Rutas
app.use('/api/zabbix', require('./routes/zabbix'));
app.use('/api/auth', require('./routes/Auth'));
app.use('/api/usuarios', require('./routes/Usuarios'));
app.use('/api/Eventos', require('./routes/Integrador'));
app.use('/api/disponibles', require('./routes/Disponibles'));  


// Puerto de la app y escucha
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
