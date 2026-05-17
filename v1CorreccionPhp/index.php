<?php


$origenesPermitidos = array(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost',
    'https://gilded-gaufre-e2d152.netlify.app',
);

$origenDeLaPeticion = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origenDeLaPeticion, $origenesPermitidos, true)) {
    header('Access-Control-Allow-Origin: ' . $origenDeLaPeticion);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/controllers/ChollosController.php';
require_once __DIR__ . '/controllers/ComentariosController.php';
require_once __DIR__ . '/tareas/limpiar_chollos_caducados.php';


limpiarChollosCaducados();
require_once __DIR__ . '/controllers/FavoritosController.php';


$metodoPeticion = $_SERVER['REQUEST_METHOD'];  
$urlCompleta    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$carpetaScript = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');

if ($carpetaScript !== '' && substr($urlCompleta, 0, strlen($carpetaScript)) === $carpetaScript) {
    $urlCompleta = substr($urlCompleta, strlen($carpetaScript));
}

$urlLimpia = preg_replace('#^/api#', '', $urlCompleta);


$urlLimpia = rtrim($urlLimpia, '/');
if ($urlLimpia === '') {
    $urlLimpia = '/';
}

$segmentos = explode('/', ltrim($urlLimpia, '/'));


try {

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


    elseif ($segmentos[0] === 'usuarios') {

        $controladorUsuarios = new UsuariosController();
        $segundoSegmento     = isset($segmentos[1]) ? $segmentos[1] : '';
        $tercerSegmento      = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($segundoSegmento === 'me' && $tercerSegmento === 'puntos') {
            
            if ($metodoPeticion === 'POST') {
                $controladorUsuarios->actualizarPuntos();
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($segundoSegmento === 'me') {
            
            if ($metodoPeticion === 'PUT') {
                $controladorUsuarios->actualizar();

            } elseif ($metodoPeticion === 'GET') {
                
                $controladorAuth2 = new AuthController();
                $controladorAuth2->me();

            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($segundoSegmento === 'puntos') {
           
            if ($metodoPeticion === 'POST') {
                $controladorUsuarios->actualizarPuntos();
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif (is_numeric($segundoSegmento)) {
           
            if ($metodoPeticion === 'GET') {
                $controladorUsuarios->ver((int) $segundoSegmento);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


    elseif ($segmentos[0] === 'chollos') {

        $controladorChollos     = new ChollosController();
        $controladorComentarios = new ComentariosController();

        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idChollo = (int) $segmentos[1];
        } else {
            $idChollo = null;
        }

        $subrecurso = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($idChollo === null) {

            
            if ($metodoPeticion === 'GET') {
                $controladorChollos->listar();

            } elseif ($metodoPeticion === 'POST') {
                $controladorChollos->crear();

            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($subrecurso === '') {
           
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
          
            if ($metodoPeticion === 'POST') {
                $controladorChollos->votar($idChollo);
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($subrecurso === 'comentarios') {
           
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


    elseif ($segmentos[0] === 'comentarios') {

        $controladorComentarios = new ComentariosController();

       
        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idComentario = (int) $segmentos[1];
        } else {
            $idComentario = null;
        }

        $subrecurso = isset($segmentos[2]) ? $segmentos[2] : '';

        if ($idComentario !== null && $subrecurso === 'votar') {
            
            if ($metodoPeticion === 'POST') {
                $controladorComentarios->votar($idComentario);
            } else {
                responderError('Método no permitido', 405);
            }

        } elseif ($idComentario !== null) {
           
            if ($metodoPeticion === 'DELETE') {
                $controladorComentarios->eliminar($idComentario);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            responderError('Ruta no encontrada', 404);
        }
    }


   
    elseif ($segmentos[0] === 'favoritos') {

        $controladorFavoritos = new FavoritosController();

       
        if (isset($segmentos[1]) && is_numeric($segmentos[1])) {
            $idChollo = (int) $segmentos[1];
        } else {
            $idChollo = null;
        }

        if ($idChollo !== null) {
            
            if ($metodoPeticion === 'POST') {
                $controladorFavoritos->alternarFavorito($idChollo);
            } else {
                responderError('Método no permitido', 405);
            }

        } else {
            
            if ($metodoPeticion === 'GET') {
                $controladorFavoritos->listar();
            } else {
                responderError('Método no permitido', 405);
            }
        }
    }

    else {
        responderError('Ruta no encontrada', 404);
    }


} catch (PDOException $errorBaseDatos) {
    error_log('[CholloPoint] Error de base de datos: ' . $errorBaseDatos->getMessage());
    responderError('Error interno del servidor', 500);

} catch (Throwable $errorGeneral) {
    error_log('[CholloPoint] Error inesperado: ' . $errorGeneral->getMessage());
    responderError('Error interno del servidor', 500);
}
