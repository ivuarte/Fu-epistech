# EpistechFrontend/Dockerfile

# Etapa de build
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# AJUSTA el script si usas otro (build, build:prod, etc.)
RUN npm run build

# Etapa de servidor web
FROM nginx:alpine

# Copia el build al docroot de Nginx
# Para CRA normalmente es "build", para Vite suele ser "dist"
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
