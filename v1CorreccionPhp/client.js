// ============================================================
//  src/api/client.js
//
//  Cliente HTTP para conectar el frontend React con el
//  backend PHP de CholloPoint.
//
//  Cómo usarlo en cualquier componente React:
//    import api from './api/client';
//    const respuesta = await api.post('/auth/login', { email, password });
// ============================================================

// Dirección base del backend de CholloPoint
// Si existe la variable de entorno VITE_API_URL la usamos; si no, usamos localhost
const URL_BASE_API = import.meta.env.VITE_API_URL || 'http://localhost/chollopoint-backend';


// Lee el token de sesión guardado en el navegador
function obtenerTokenGuardado() {
    return localStorage.getItem('chollopoint_token');
}


// ── Función principal que hace todas las peticiones HTTP ──────────────────────
// Todos los métodos de la API usan esta función por debajo
async function hacerPeticion(metodo, ruta, cuerpo) {
    // Preparamos las cabeceras que irán en todas las peticiones
    const cabeceras = {
        'Content-Type': 'application/json',
    };

    // Si hay un token de sesión guardado, lo añadimos para identificarnos
    const token = obtenerTokenGuardado();
    if (token) {
        cabeceras['Authorization'] = 'Bearer ' + token;
    }

    // Configuración de la petición fetch
    const configuracion = {
        method:  metodo,
        headers: cabeceras,
    };

    // Solo añadimos el cuerpo si hay datos que enviar (POST, PUT)
    if (cuerpo) {
        configuracion.body = JSON.stringify(cuerpo);
    }

    // Hacemos la petición al backend
    const respuestaHttp = await fetch(URL_BASE_API + ruta, configuracion);

    // Convertimos la respuesta de JSON a objeto JavaScript
    const respuestaJSON = await respuestaHttp.json();

    // Si el servidor devolvió un error HTTP (4xx, 5xx), lanzamos una excepción
    // para que el componente que llamó a la función pueda capturarla con try/catch
    if (!respuestaHttp.ok) {
        const mensajeError = respuestaJSON.error || ('Error ' + respuestaHttp.status);
        throw new Error(mensajeError);
    }

    return respuestaJSON;
}


// ── Objeto principal de la API ────────────────────────────────────────────────
// Aquí agrupamos todas las llamadas a la API de CholloPoint por secciones

const api = {

    // Métodos genéricos para hacer peticiones directas
    get: function(ruta) {
        return hacerPeticion('GET', ruta, null);
    },

    post: function(ruta, cuerpo) {
        return hacerPeticion('POST', ruta, cuerpo);
    },

    put: function(ruta, cuerpo) {
        return hacerPeticion('PUT', ruta, cuerpo);
    },

    delete: function(ruta) {
        return hacerPeticion('DELETE', ruta, null);
    },


    // ── Autenticación ─────────────────────────────────────────────────────────

    // Inicia sesión con email y contraseña
    // Si tiene éxito, guarda el token en el navegador automáticamente
    login: async function(email, password) {
        const respuesta = await hacerPeticion('POST', '/auth/login', { email: email, password: password });

        if (respuesta.data && respuesta.data.token) {
            localStorage.setItem('chollopoint_token', respuesta.data.token);
        }

        return respuesta;
    },

    // Crea una cuenta nueva en CholloPoint
    // Si tiene éxito, guarda el token en el navegador automáticamente
    registro: async function(nombre, email, password) {
        const respuesta = await hacerPeticion('POST', '/auth/registro', {
            nombre:   nombre,
            email:    email,
            password: password,
        });

        if (respuesta.data && respuesta.data.token) {
            localStorage.setItem('chollopoint_token', respuesta.data.token);
        }

        return respuesta;
    },

    // Cierra la sesión borrando los datos guardados en el navegador
    logout: function() {
        localStorage.removeItem('chollopoint_token');
        localStorage.removeItem('chollopoint_usuario');
    },

    // Obtiene los datos del usuario que está logueado ahora mismo
    me: function() {
        return hacerPeticion('GET', '/auth/me', null);
    },


    // ── Chollos ───────────────────────────────────────────────────────────────
    chollos: {

        // Obtiene el listado de chollos con filtros opcionales
        // Ejemplo de uso: api.chollos.listar({ categoria: 'Electrónica', ciudad: 'Madrid' })
        listar: function(filtros) {
            const parametros = filtros || {};
            const cadenaFiltros = new URLSearchParams(parametros).toString();
            const ruta = cadenaFiltros ? '/chollos?' + cadenaFiltros : '/chollos';
            return hacerPeticion('GET', ruta, null);
        },

        // Obtiene el detalle completo de un chollo por su ID
        ver: function(id) {
            return hacerPeticion('GET', '/chollos/' + id, null);
        },

        // Publica un chollo nuevo en CholloPoint
        crear: function(datosChollo) {
            return hacerPeticion('POST', '/chollos', datosChollo);
        },

        // Edita un chollo existente (solo el autor puede hacerlo)
        editar: function(id, datosNuevos) {
            return hacerPeticion('PUT', '/chollos/' + id, datosNuevos);
        },

        // Borra un chollo (solo el autor puede hacerlo)
        eliminar: function(id) {
            return hacerPeticion('DELETE', '/chollos/' + id, null);
        },

        // Vota un chollo como "positivo" o "negativo"
        votar: function(id, tipo) {
            return hacerPeticion('POST', '/chollos/' + id + '/votar', { tipo: tipo });
        },
    },


    // ── Comentarios ───────────────────────────────────────────────────────────
    comentarios: {

        // Obtiene todos los comentarios de un chollo
        listar: function(idChollo) {
            return hacerPeticion('GET', '/chollos/' + idChollo + '/comentarios', null);
        },

        // Publica un comentario nuevo en un chollo
        crear: function(idChollo, texto) {
            return hacerPeticion('POST', '/chollos/' + idChollo + '/comentarios', { texto: texto });
        },

        // Borra un comentario (solo el autor puede hacerlo)
        eliminar: function(id) {
            return hacerPeticion('DELETE', '/comentarios/' + id, null);
        },

        // Vota un comentario como "positivo" o "negativo"
        votar: function(id, tipo) {
            return hacerPeticion('POST', '/comentarios/' + id + '/votar', { tipo: tipo });
        },
    },


    // ── Favoritos ─────────────────────────────────────────────────────────────
    favoritos: {

        // Obtiene los chollos que el usuario tiene guardados como favoritos
        listar: function() {
            return hacerPeticion('GET', '/favoritos', null);
        },

        // Guarda o quita un chollo de favoritos (funciona como un interruptor)
        alternarFavorito: function(id) {
            return hacerPeticion('POST', '/favoritos/' + id, null);
        },
    },


    // ── Usuarios ──────────────────────────────────────────────────────────────
    usuario: {

        // Obtiene el perfil público de cualquier usuario por su ID
        ver: function(id) {
            return hacerPeticion('GET', '/usuarios/' + id, null);
        },

        // Actualiza los datos del perfil del usuario logueado
        actualizar: function(datosNuevos) {
            return hacerPeticion('PUT', '/usuarios/me', datosNuevos);
        },

        // Suma o resta puntos al usuario logueado
        // Pasa un número positivo para sumar o negativo para restar
        actualizarPuntos: function(cantidad) {
            return hacerPeticion('POST', '/usuarios/puntos', { cantidad: cantidad });
        },
    },
};

export default api;