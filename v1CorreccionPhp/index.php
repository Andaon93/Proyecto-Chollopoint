<?php
// ============================================================
//  index.php — Router de CholloPoint
//
//  Este archivo es el punto de entrada de toda la API.
//  Todas las peticiones del frontend llegan aquí primero.
//  Su trabajo es:
//    1. Gestionar los permisos CORS (quién puede llamar a la API)
//    2. Leer la URL que pidió el frontend
//    3. Decidir qué controlador y qué función deben responder
// ============================================================


// ── 1. CORS: permisos de acceso desde el frontend ─────────────────────────────
// CORS es un mecanismo de seguridad del navegador que impide que una web
// llame a una API de otro dominio sin permiso explícito.
// Aquí indicamos desde qué direcciones se puede llamar a nuestra API.

$origenesPermitidos = array(
    'http://localhost:5173',   // Vite en desarrollo
    'http://localhost:3000',   // Create React App en desarrollo
    'http://localhost',        // Apache local sin puerto
    'https://tudominio.com',   // ← Cambia esto por tu dominio real en producción
);

// El navegador envía su origen en la cabecera HTTP_ORIGIN
$origenDeLaPeticion = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Si el origen está en la lista permitida, se lo decimos al navegador
if (in_array($origenDeLaPeticion, $origenesPermitidos, true)) {
    header('Access-Control-Allow-Origin: ' . $origenDeLaPeticion);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Las peticiones OPTIONS son "preflight": el navegador pregunta antes de enviar datos.
// Respondemos 204 (sin contenido) y terminamos.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// ── 2. Cargamos todos los archivos que necesitamos ────────────────────────────
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/controllers/ChollosController.php';
require_once __DIR__ . '/controllers/ComentariosController.php';
require_once __DIR__ . '/tareas/limpiar_chollos_caducados.php';


// ── 3. Limpieza automática de chollos caducados ───────────────────────────────
// Borramos los chollos que llevan más de 2 días caducados.
// Esto se ejecuta en cada petición, pero es tan rápido (una sola consulta SQL)
// que el usuario no notará ninguna diferencia.
// Cuando un chollo se borra aquí, también se borran automáticamente todos sus
// comentarios, votos y favoritos gracias a la configuración ON DELETE CASCADE
// de la base de datos.
limpiarChollosCaducados();
require_once __DIR__ . '/controllers/FavoritosController.php';


// ── 3. Leemos el método HTTP y la URL que pidió el frontend ───────────────────
$metodoPeticion = $_SERVER['REQUEST_METHOD'];  // GET, POST, PUT, DELETE...
$urlCompleta    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Si el backend está instalado en un subdirectorio (ej: /chollopoint-backend),
// quitamos ese prefijo para trabajar siempre con rutas limpias como /chollos/1
$carpetaScript = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');

if ($carpetaScript !== '' && substr($urlCompleta, 0, strlen($carpetaScript)) === $carpetaScript) {
    $urlCompleta = substr($urlCompleta, strlen($carpetaScript));
}

// Si el frontend llama a /api/chollos, quitamos el /api del principio
$urlLimpia = preg_replace('#^/api#', '', $urlCompleta);

// Quitamos la barra del final y si queda vacío ponemos '/'
$urlLimpia = rtrim($urlLimpia, '/');
if ($urlLimpia === '') {
    $urlLimpia = '/';
}

// Dividimos la URL en segmentos para analizarla fácilmente
// Ejemplo: /chollos/5/comentarios → array('chollos', '5', 'comentarios')
$segmentos = explode('/', ltrim($urlLimpia, '/'));


// ── 4. Router: decidimos qué controlador responde ────────────────────────────
// Cada bloque if/elseif corresponde a un grupo de rutas de la API

try {

    // ── Rutas de /auth ────────────────────────────────────────────────────────
    if ($segmentos[0] === 'auth') {

        $controladorAuth = new AuthController();
        $segundoSegmento = isset($segmentos[1]) ? $segmentos[1] : '';

        if ($metodoPeticion === 'POST' && $segundoSegmento === 'registro') {
            $controladorAuth->registro();

        } elseif ($metodoPeticion === 'POST' && $segundoSegmento === 'login') {
            $controladorAuth->login();

        } elseif ($metodoPeticion === 'GET' && $segundoSegmento === 'me') {
            $controladorAuth->me();

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


    // ── Rutas de /usuarios ────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'usuarios') {

        $controladorUsuarios = new UsuariosController();
        $segundoSegmento     = isset($segmentos[1]) ? $segmentos[1] : '';
        $tercerSegmento      = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($segundoSegmento === 'me' && $tercerSegmento === 'puntos') {
            // PUT /usuarios/me/puntos — actualizar mis puntos
            if ($metodoPeticion === 'POST') {
                $controladorUsuarios->actualizarPuntos();
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($segundoSegmento === 'me') {
            // /usuarios/me — ver o editar mi propio perfil
            if ($metodoPeticion === 'PUT') {
                $controladorUsuarios->actualizar();

            } elseif ($metodoPeticion === 'GET') {
                // GET /usuarios/me es un alias de GET /auth/me
                $controladorAuth2 = new AuthController();
                $controladorAuth2->me();

            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($segundoSegmento === 'puntos') {
            // POST /usuarios/puntos — ruta alternativa más corta
            if ($metodoPeticion === 'POST') {
                $controladorUsuarios->actualizarPuntos();
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif (is_numeric($segundoSegmento)) {
            // GET /usuarios/{id} — ver perfil público de un usuario
            if ($metodoPeticion === 'GET') {
                $controladorUsuarios->ver((int) $segundoSegmento);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


    // ── Rutas de /chollos ─────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'chollos') {

        $controladorChollos     = new ChollosController();
        $controladorComentarios = new ComentariosController();

        // Comprobamos si el segundo segmento es un número (ID de chollo)
        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idChollo = (int) $segmentos[1];
        } else {
            $idChollo = null;
        }

        $subrecurso = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($idChollo === null) {
            // /chollos — listar o crear
            if ($metodoPeticion === 'GET') {
                $controladorChollos->listar();

            } elseif ($metodoPeticion === 'POST') {
                $controladorChollos->crear();

            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($subrecurso === '') {
            // /chollos/{id} — ver, editar o borrar un chollo concreto
            if ($metodoPeticion === 'GET') {
                $controladorChollos->ver($idChollo);

            } elseif ($metodoPeticion === 'PUT') {
                $controladorChollos->editar($idChollo);

            } elseif ($metodoPeticion === 'DELETE') {
                $controladorChollos->eliminar($idChollo);

            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($subrecurso === 'votar') {
            // POST /chollos/{id}/votar — votar un chollo
            if ($metodoPeticion === 'POST') {
                $controladorChollos->votar($idChollo);
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($subrecurso === 'comentarios') {
            // /chollos/{id}/comentarios — listar o añadir comentarios
            if ($metodoPeticion === 'GET') {
                $controladorComentarios->listar($idChollo);

            } elseif ($metodoPeticion === 'POST') {
                $controladorComentarios->crear($idChollo);

            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


    // ── Rutas de /comentarios ─────────────────────────────────────────────────
    elseif ($segmentos[0] === 'comentarios') {

        $controladorComentarios = new ComentariosController();

        // Comprobamos si hay un ID de comentario en la URL
        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idComentario = (int) $segmentos[1];
        } else {
            $idComentario = null;
        }

        $subrecurso = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($idComentario !== null && $subrecurso === 'votar') {
            // POST /comentarios/{id}/votar — votar un comentario
            if ($metodoPeticion === 'POST') {
                $controladorComentarios->votar($idComentario);
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($idComentario !== null) {
            // DELETE /comentarios/{id} — borrar un comentario
            if ($metodoPeticion === 'DELETE') {
                $controladorComentarios->eliminar($idComentario);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


    // ── Rutas de /favoritos ───────────────────────────────────────────────────
    elseif ($segmentos[0] === 'favoritos') {

        $controladorFavoritos = new FavoritosController();

        // Comprobamos si hay un ID de chollo en la URL
        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idChollo = (int) $segmentos[1];
        } else {
            $idChollo = null;
        }

        if ($idChollo !== null) {
            // POST /favoritos/{id} — guardar o quitar de favoritos
            if ($metodoPeticion === 'POST') {
                $controladorFavoritos->alternarFavorito($idChollo);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            // GET /favoritos — ver mis chollos favoritos
            if ($metodoPeticion === 'GET') {
                $controladorFavoritos->listar();
            } else {
                responderError('Método no permitido', 405);
            }
        }
    }


    // ── Ruta no reconocida ────────────────────────────────────────────────────
    else {
        responderError('Ruta no encontrada', 404);
    }


// ── Gestión de errores ────────────────────────────────────────────────────────
// Si algo falla de forma inesperada, lo registramos en el log del servidor
// y respondemos con un error genérico (sin exponer detalles internos)

} catch (PDOException $errorBaseDatos) {
    error_log('[CholloPoint] Error de base de datos: ' . $errorBaseDatos->getMessage());
    responderError('Error interno del servidor', 500);

} catch (Throwable $errorGeneral) {
    error_log('[CholloPoint] Error inesperado: ' . $errorGeneral->getMessage());
    responderError('Error interno del servidor', 500);
}