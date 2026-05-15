// ─────────────────────────────────────────────────────────────
//  src/api/client.js
//
//  Aquí centralizo todas las llamadas al backend PHP.
//  Así no tengo que repetir fetch() en cada componente.
//
//  Ejemplo de uso:
//    import api from '../api/client';
//    const datos = await api.chollos.listar();
// ─────────────────────────────────────────────────────────────
 
// La URL base sale del .env para poder cambiarla sin tocar el código
const URL_BASE = import.meta.env.VITE_API_URL || "http://localhost/chollopoint-backend";
 
// Nombre de la clave con la que guardo el token en localStorage
const TOKEN_KEY = "chollopoint_token";
 
// Devuelve el token si existe, o null si no hay sesión
function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}
 
// ── Función central que hace todos los fetch ──────────────────────────────────
async function peticion(metodo, endpoint, cuerpo = null) {
  const cabeceras = { "Content-Type": "application/json" };
 
  // Si hay token de sesión lo añado a la cabecera
  const token = obtenerToken();
  if (token) {
    cabeceras["Authorization"] = `Bearer ${token}`;
  }
 
  const opciones = { method: metodo, headers: cabeceras };
 
  // Solo añado body si la petición lleva datos
  if (cuerpo) {
    opciones.body = JSON.stringify(cuerpo);
  }
 
  const respuesta = await fetch(`${URL_BASE}${endpoint}`, opciones);
  const json = await respuesta.json();
 
  // Si el servidor devuelve un error lo lanzo para manejarlo desde el componente
  if (!respuesta.ok) {
    throw new Error(json.error || `Error ${respuesta.status}`);
  }
 
  return json;
}
 
// ── Objeto principal que exporto ──────────────────────────────────────────────
const api = {
 
  // Métodos genéricos por si necesito hacer una llamada directa
  get:    (url)        => peticion("GET",    url),
  post:   (url, datos) => peticion("POST",   url, datos),
  put:    (url, datos) => peticion("PUT",    url, datos),
  delete: (url)        => peticion("DELETE", url),
 
  // ── Autenticación ─────────────────────────────────────────────────────────
  login: async (email, password) => {
    const res = await peticion("POST", "/auth/login", { email, password });
    // Si el login va bien guardo el token para las siguientes peticiones
    if (res.data?.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
  },
 
  registro: async (nombre, email, password) => {
    const res = await peticion("POST", "/auth/registro", { nombre, email, password });
    // Al registrarse también inicio sesión automáticamente
    if (res.data?.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res;
  },
 
  logout: () => {
    // Borro todo lo relacionado con la sesión
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("chollopoint_usuario");
  },
 
  // Obtiene los datos del usuario logueado
  me: () => peticion("GET", "/auth/me"),
 
  // ── Chollos ───────────────────────────────────────────────────────────────
  chollos: {
    // Admite filtros opcionales como { categoria, ciudad, ordenar }
    listar: (filtros = {}) => {
      const queryString = new URLSearchParams(filtros).toString();
      const ruta = queryString ? `/chollos?${queryString}` : "/chollos";
      return peticion("GET", ruta);
    },
    ver:      (id)        => peticion("GET",    `/chollos/${id}`),
    crear:    (datos)     => peticion("POST",   "/chollos", datos),
    editar:   (id, datos) => peticion("PUT",    `/chollos/${id}`, datos),
    eliminar: (id)        => peticion("DELETE", `/chollos/${id}`),
    // tipo puede ser "up" o "down"
    votar:    (id, tipo)  => peticion("POST",   `/chollos/${id}/votar`, { tipo }),
  },
 
  // ── Comentarios ───────────────────────────────────────────────────────────
  comentarios: {
    listar:   (idChollo)         => peticion("GET",    `/chollos/${idChollo}/comentarios`),
    crear:    (idChollo, texto)  => peticion("POST",   `/chollos/${idChollo}/comentarios`, { texto }),
    eliminar: (id)               => peticion("DELETE", `/comentarios/${id}`),
    votar:    (id, tipo)         => peticion("POST",   `/comentarios/${id}/votar`, { tipo }),
  },
 
  // ── Favoritos ─────────────────────────────────────────────────────────────
  favoritos: {
    listar: ()    => peticion("GET",  "/favoritos"),
    // Si ya es favorito lo quita, si no lo añade
    toggle: (id)  => peticion("POST", `/favoritos/${id}`),
  },
 
  // ── Perfil de usuario ─────────────────────────────────────────────────────
  usuario: {
    ver:         (id)       => peticion("GET", `/usuarios/${id}`),
    actualizar:  (datos)    => peticion("PUT", "/usuarios/me", datos),
    sumarPuntos: (cantidad) => peticion("POST", "/usuarios/puntos", { cantidad }),
  },
};
 
export default api;