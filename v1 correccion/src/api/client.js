const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost/chollopoint-backend';

function getToken() {
  return localStorage.getItem('chollopoint_token');
}

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('chollopoint_token');
      localStorage.removeItem('chollopoint_usuario');
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error(json.error ?? `Error ${res.status}`);
  }

  return json;
}

const api = {
  get:    (url)       => request('GET',    url),
  post:   (url, body) => request('POST',   url, body),
  put:    (url, body) => request('PUT',    url, body),
  delete: (url)       => request('DELETE', url),

  login: async function(email, password) {
    const res = await request('POST', '/auth/login', { email, password });
    if (res.data?.token) localStorage.setItem('chollopoint_token', res.data.token);
    return res;
  },

  registro: async function(nombre, email, password) {
    const res = await request('POST', '/auth/registro', { nombre, email, password });
    if (res.data?.token) localStorage.setItem('chollopoint_token', res.data.token);
    return res;
  },

  logout: function() {
    localStorage.removeItem('chollopoint_token');
    localStorage.removeItem('chollopoint_usuario');
  },

  me: function() {
    return request('GET', '/auth/me');
  },

  chollos: {
    listar:   function(params) {
      let queryString = "";
      if (params && Object.keys(params).length > 0) queryString = "?" + new URLSearchParams(params).toString();
      return request('GET', `/chollos${queryString}`);
    },
    ver:      function(id)       { return request('GET',    `/chollos/${id}`); },
    crear:    function(body)     { return request('POST',   '/chollos', body); },
    editar:   function(id, body) { return request('PUT',    `/chollos/${id}`, body); },
    eliminar: function(id)       { return request('DELETE', `/chollos/${id}`); },
    votar:    function(id, tipo) { return request('POST',   `/chollos/${id}/votar`, { tipo }); },
  },

  comentarios: {
    listar:   function(cholloId)        { return request('GET',    `/chollos/${cholloId}/comentarios`); },
    crear:    function(cholloId, texto) { return request('POST',   `/chollos/${cholloId}/comentarios`, { texto }); },
    eliminar: function(id)              { return request('DELETE', `/comentarios/${id}`); },
    votar:    function(id, tipo)        { return request('POST',   `/comentarios/${id}/votar`, { tipo }); },
  },

  favoritos: {
    listar: function()   { return request('GET',  '/favoritos'); },
    toggle: function(id) { return request('POST', `/favoritos/${id}`); },
  },

  usuario: {
    ver:         function(id)       { return request('GET',  `/usuarios/${id}`); },
    actualizar:  function(body)     { return request('PUT',  '/usuarios/me', body); },
    sumarPuntos: function(cantidad) { return request('POST', '/usuarios/puntos', { cantidad }); },
  },
};

export default api;