
const URL_BASE_API = import.meta.env.VITE_API_URL || 'http://localhost/chollopoint-backend';


function obtenerTokenGuardado() {
    return localStorage.getItem('chollopoint_token');
}

async function hacerPeticion(metodo, ruta, cuerpo) {
    
    const cabeceras = {
        'Content-Type': 'application/json',
    };

    const token = obtenerTokenGuardado();
    if (token) {
        cabeceras['Authorization'] = 'Bearer ' + token;
    }

    const configuracion = {
        method:  metodo,
        headers: cabeceras,
    };

    if (cuerpo) {
        configuracion.body = JSON.stringify(cuerpo);
    }

    const respuestaHttp = await fetch(URL_BASE_API + ruta, configuracion);

    const respuestaJSON = await respuestaHttp.json();

    if (!respuestaHttp.ok) {
        const mensajeError = respuestaJSON.error || ('Error ' + respuestaHttp.status);
        throw new Error(mensajeError);
    }

    return respuestaJSON;
}

const api = {

   
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

    login: async function(email, password) {
        const respuesta = await hacerPeticion('POST', '/auth/login', { email: email, password: password });

        if (respuesta.data && respuesta.data.token) {
            localStorage.setItem('chollopoint_token', respuesta.data.token);
        }

        return respuesta;
    },

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

    
    logout: function() {
        localStorage.removeItem('chollopoint_token');
        localStorage.removeItem('chollopoint_usuario');
    },

   
    me: function() {
        return hacerPeticion('GET', '/auth/me', null);
    },


   
    chollos: {

        listar: function(filtros) {
            const parametros = filtros || {};
            const cadenaFiltros = new URLSearchParams(parametros).toString();
            const ruta = cadenaFiltros ? '/chollos?' + cadenaFiltros : '/chollos';
            return hacerPeticion('GET', ruta, null);
        },

       
        ver: function(id) {
            return hacerPeticion('GET', '/chollos/' + id, null);
        },

        crear: function(datosChollo) {
            return hacerPeticion('POST', '/chollos', datosChollo);
        },

        editar: function(id, datosNuevos) {
            return hacerPeticion('PUT', '/chollos/' + id, datosNuevos);
        },

        
        eliminar: function(id) {
            return hacerPeticion('DELETE', '/chollos/' + id, null);
        },

       
        votar: function(id, tipo) {
            return hacerPeticion('POST', '/chollos/' + id + '/votar', { tipo: tipo });
        },
    },


    comentarios: {

        listar: function(idChollo) {
            return hacerPeticion('GET', '/chollos/' + idChollo + '/comentarios', null);
        },

        crear: function(idChollo, texto) {
            return hacerPeticion('POST', '/chollos/' + idChollo + '/comentarios', { texto: texto });
        },

        eliminar: function(id) {
            return hacerPeticion('DELETE', '/comentarios/' + id, null);
        },

        votar: function(id, tipo) {
            return hacerPeticion('POST', '/comentarios/' + id + '/votar', { tipo: tipo });
        },
    },


    favoritos: {

        
        listar: function() {
            return hacerPeticion('GET', '/favoritos', null);
        },

        
        alternarFavorito: function(id) {
            return hacerPeticion('POST', '/favoritos/' + id, null);
        },
    },


   
    usuario: {

        ver: function(id) {
            return hacerPeticion('GET', '/usuarios/' + id, null);
        },

        actualizar: function(datosNuevos) {
            return hacerPeticion('PUT', '/usuarios/me', datosNuevos);
        },

        actualizarPuntos: function(cantidad) {
            return hacerPeticion('POST', '/usuarios/puntos', { cantidad: cantidad });
        },
    },
};

export default api;
