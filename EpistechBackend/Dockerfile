# Usa una imagen base oficial de Node.js
FROM node:20-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (o yarn.lock)
# antes de instalar las dependencias. Esto permite a Docker usar la caché de capas
# si las dependencias no han cambiado, acelerando las futuras construcciones.
COPY package*.json ./

RUN npm install --only=production

# Copia el resto del código de la aplicación al directorio de trabajo en el contenedor
COPY . .

# Expone el puerto en el que la aplicación Express escuchará.
# Asegúrate de que este puerto coincida con el puerto que tu aplicación usa (por defecto 4000 en tu index.js)
EXPOSE 4000

CMD ["npm", "start"]