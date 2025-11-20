# EpistechBackend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Solo copiamos los manifests primero para cachear la instalación
COPY package*.json ./

# Instala dependencias (usa npm ci si tienes package-lock.json)
RUN npm install --omit=dev

# Ahora copiamos el resto del código
COPY . .

# AJUSTA este puerto al que realmente usa tu backend
EXPOSE 4000

# Usa el script "start" de tu package.json
CMD ["npm", "start"]
