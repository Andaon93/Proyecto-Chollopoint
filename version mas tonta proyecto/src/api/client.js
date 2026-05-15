// cliente para conectar con el backend php

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost/chollopoint-backend";

const getToken = () => localStorage.getItem("chollopoint_token");

async function request(method, endpoint, body = null) {
  const headers = { "Content-Type": "application/json" };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `Error ${res.status}`);
  }

  return json;
}

const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  delete: (url) => request("DELETE", url),

  login: async (email, password) => {
    const res = await request("POST", "/auth/login", { email, password });
    if (res.data?.token) {
      localStorage.setItem("chollopoint_token", res.data.token);
    }
    return res;
  },

  registro: async (nombre, email, password) => {
    const res = await request("POST", "/auth/registro", { nombre, email, password });
    if (res.data?.token) {
      localStorage.setItem("chollopoint_token", res.data.token);
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem("chollopoint_token");
    localStorage.removeItem("chollopoint_usuario");
  },

  me: () => request("GET", "/auth/me"),

  chollos: {
    listar: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request("GET", `/chollos${qs ? "?" + qs : ""}`);
    },
    ver: (id) => request("GET", `/chollos/${id}`),
    crear: (body) => request("POST", "/chollos", body),
    editar: (id, body) => request("PUT", `/chollos/${id}`, body),
    eliminar: (id) => request("DELETE", `/chollos/${id}`),
    votar: (id, tipo) => request("POST", `/chollos/${id}/votar`, { tipo }),
  },

  comentarios: {
    listar: (cholloId) => request("GET", `/chollos/${cholloId}/comentarios`),
    crear: (cholloId, texto) => request("POST", `/chollos/${cholloId}/comentarios`, { texto }),
    eliminar: (id) => request("DELETE", `/comentarios/${id}`),
    votar: (id, tipo) => request("POST", `/comentarios/${id}/votar`, { tipo }),
  },

  favoritos: {
    listar: () => request("GET", "/favoritos"),
    toggle: (id) => request("POST", `/favoritos/${id}`),
  },

  usuario: {
    ver: (id) => request("GET", `/usuarios/${id}`),
    actualizar: (body) => request("PUT", "/usuarios/me", body),
    sumarPuntos: (cantidad) => request("POST", "/usuarios/puntos", { cantidad }),
  },
};

export default api;