import axios from "axios";

const tokenAuth = (token) => {
  if (token) {
    // Establece el token en el formato 'Bearer <token>' que espera el backend
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    // Elimina el header si el token no existe (ej. al cerrar sesión)
    delete axios.defaults.headers.common["Authorization"];
  }
};

export default tokenAuth;