<?php
// ============================================================
//  index.php  —  Router / Front Controller de CholloPoint API
// ============================================================

// ── CORS ──────────────────────────────────────────────────────────────────────
$allowedOrigins = [
    'http://localhost:5173',   // Vite dev
    'http://localhost:3000',
    'http://localhost',
    'https://tudominio.com',   // ← cambia en producción
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Autoload de helpers y controladores ───────────────────────────────────────
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/controllers/ChollosController.php';
require_once __DIR__ . '/controllers/ComentariosController.php';
require_once __DIR__ . '/controllers/FavoritosController.php';

// ── Parsear la ruta ───────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Quitar el prefijo del script (funciona tanto en subdirectorio como en raíz)
// Ejemplo: si el backend está en /chollopoint-backend, lo quitamos.
$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
if ($scriptDir !== '' && str_starts_with($uri, $scriptDir)) {
    $uri = substr($uri, strlen($scriptDir));
}

// Quitar prefijo /api si existe (útil si el frontend llama a /api/...)
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/') ?: '/';

// Segmentos de la ruta
$segmentos = explode('/', ltrim($uri, '/'));
// ej: /chollos/5/comentarios → ['chollos', '5', 'comentarios']

// ── Router ────────────────────────────────────────────────────────────────────

try {

    // ── /auth ─────────────────────────────────────────────────────────────────
    if ($segmentos[0] === 'auth') {
        $ctrl = new AuthController();

        match ([$method, $segmentos[1] ?? '']) {
            ['POST', 'registro'] => $ctrl->registro(),
            ['POST', 'login']    => $ctrl->login(),
            ['GET',  'me']       => $ctrl->me(),
            default              => error('Ruta no encontrada', 404),
        };
    }

    // ── /usuarios ─────────────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'usuarios') {
        $ctrl = new UsuariosController();
        $sub  = $segmentos[1] ?? '';

        if ($sub === 'me' && ($segmentos[2] ?? '') === 'puntos') {
            // /usuarios/me/puntos
            if ($method === 'POST') $ctrl->sumarPuntos();
            else error('Método no permitido', 405);
        } elseif ($sub === 'me') {
            match ($method) {
                'PUT'   => $ctrl->actualizar(),
                'GET'   => (function() use ($ctrl) {
                    // Alias GET /usuarios/me → /auth/me
                    $authCtrl = new AuthController();
                    $authCtrl->me();
                })(),
                default => error('Método no permitido', 405),
            };
        } elseif ($sub === 'puntos') {
            // /usuarios/puntos (alias más corto desde el frontend)
            if ($method === 'POST') $ctrl->sumarPuntos();
            else error('Método no permitido', 405);
        } elseif (is_numeric($sub)) {
            if ($method === 'GET') $ctrl->ver((int) $sub);
            else error('Método no permitido', 405);
        } else {
            error('Ruta no encontrada', 404);
        }
    }

    // ── /chollos ──────────────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'chollos') {
        $cholloCtrl = new ChollosController();
        $comentCtrl = new ComentariosController();
        $cholloId   = isset($segmentos[1]) && is_numeric($segmentos[1])
                        ? (int) $segmentos[1] : null;
        $subrecurso = $segmentos[2] ?? '';
        $subId      = isset($segmentos[3]) && is_numeric($segmentos[3])
                        ? (int) $segmentos[3] : null;

        if ($cholloId === null) {
            // /chollos
            match ($method) {
                'GET'  => $cholloCtrl->listar(),
                'POST' => $cholloCtrl->crear(),
                default => error('Método no permitido', 405),
            };
        } elseif ($subrecurso === '') {
            // /chollos/{id}
            match ($method) {
                'GET'    => $cholloCtrl->ver($cholloId),
                'PUT'    => $cholloCtrl->editar($cholloId),
                'DELETE' => $cholloCtrl->eliminar($cholloId),
                default  => error('Método no permitido', 405),
            };
        } elseif ($subrecurso === 'votar') {
            // /chollos/{id}/votar
            if ($method === 'POST') $cholloCtrl->votar($cholloId);
            else error('Método no permitido', 405);
        } elseif ($subrecurso === 'comentarios') {
            // /chollos/{id}/comentarios
            match ($method) {
                'GET'  => $comentCtrl->listar($cholloId),
                'POST' => $comentCtrl->crear($cholloId),
                default => error('Método no permitido', 405),
            };
        } else {
            error('Ruta no encontrada', 404);
        }
    }

    // ── /comentarios ──────────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'comentarios') {
        $ctrl       = new ComentariosController();
        $comId      = isset($segmentos[1]) && is_numeric($segmentos[1])
                        ? (int) $segmentos[1] : null;
        $subrecurso = $segmentos[2] ?? '';

        if ($comId !== null && $subrecurso === 'votar') {
            if ($method === 'POST') $ctrl->votar($comId);
            else error('Método no permitido', 405);
        } elseif ($comId !== null) {
            if ($method === 'DELETE') $ctrl->eliminar($comId);
            else error('Método no permitido', 405);
        } else {
            error('Ruta no encontrada', 404);
        }
    }

    // ── /favoritos ────────────────────────────────────────────────────────────
    elseif ($segmentos[0] === 'favoritos') {
        $ctrl     = new FavoritosController();
        $cholloId = isset($segmentos[1]) && is_numeric($segmentos[1])
                        ? (int) $segmentos[1] : null;

        if ($cholloId !== null) {
            if ($method === 'POST') $ctrl->toggle($cholloId);
            else error('Método no permitido', 405);
        } else {
            if ($method === 'GET') $ctrl->listar();
            else error('Método no permitido', 405);
        }
    }

    // ── 404 ───────────────────────────────────────────────────────────────────
    else {
        error('Ruta no encontrada', 404);
    }

} catch (PDOException $e) {
    error_log('[CholloPoint] PDOException: ' . $e->getMessage());
    error('Error interno del servidor', 500);
} catch (Throwable $e) {
    error_log('[CholloPoint] Error: ' . $e->getMessage());
    error('Error interno del servidor', 500);
}