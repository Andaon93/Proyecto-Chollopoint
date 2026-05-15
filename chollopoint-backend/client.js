// ============================================================
//  src/api/client.js
//
//  Cliente HTTP para conectar el frontend React con el
//  backend PHP de CholloPoint.
//
//  Uso:
//    import api from './api/client';
//    const { data } = await api.post('/auth/login', { email, password });
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/chollopoint-backend';

// Lee el token guardado en localStorage
const getToken = () => localStorage.getItem('chollopoint_token');

// ── Función base de fetch ──────────────────────────────────────────────────────
async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `Error ${res.status}`);
  }

  return json;
}

// ── Métodos de conveniencia ────────────────────────────────────────────────────
const api = {
  get:    (url)          => request('GET',    url),
  post:   (url, body)    => request('POST',   url, body),
  put:    (url, body)    => request('PUT',    url, body),
  delete: (url)          => request('DELETE', url),

  // ── Auth ───────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const res = await request('POST', '/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('chollopoint_token', res.data.token);
    }
    return res;
  },

  registro: async (nombre, email, password) => {
    const res = await request('POST', '/auth/registro', { nombre, email, password });
    if (res.data?.token) {
      localStorage.setItem('chollopoint_token', res.data.token);
    }
    return res;
  },

  logout: () => {
    localStorage.removeItem('chollopoint_token');
    localStorage.removeItem('chollopoint_usuario');
  },

  me: () => request('GET', '/auth/me'),

  // ── Chollos ────────────────────────────────────────────────────────────────
  chollos: {
    listar: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/chollos${qs ? '?' + qs : ''}`);
    },
    ver:      (id)       => request('GET',    `/chollos/${id}`),
    crear:    (body)     => request('POST',   '/chollos', body),
    editar:   (id, body) => request('PUT',    `/chollos/${id}`, body),
    eliminar: (id)       => request('DELETE', `/chollos/${id}`),
    votar:    (id, tipo) => request('POST',   `/chollos/${id}/votar`, { tipo }),
  },

  // ── Comentarios ────────────────────────────────────────────────────────────
  comentarios: {
    listar:   (cholloId)        => request('GET',    `/chollos/${cholloId}/comentarios`),
    crear:    (cholloId, texto) => request('POST',   `/chollos/${cholloId}/comentarios`, { texto }),
    eliminar: (id)              => request('DELETE', `/comentarios/${id}`),
    votar:    (id)              => request('POST',   `/comentarios/${id}/votar`),
  },

  // ── Favoritos ──────────────────────────────────────────────────────────────
  favoritos: {
    listar: ()   => request('GET',  '/favoritos'),
    toggle: (id) => request('POST', `/favoritos/${id}`),
  },

  // ── Usuario ────────────────────────────────────────────────────────────────
  usuario: {
    ver:        (id)     => request('GET', `/usuarios/${id}`),
    actualizar: (body)   => request('PUT', '/usuarios/me', body),
    sumarPuntos: (cantidad) => request('POST', '/usuarios/puntos', { cantidad }),
  },
};

export default api;
