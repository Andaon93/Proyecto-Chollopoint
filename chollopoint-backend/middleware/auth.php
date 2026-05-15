<?php
// ============================================================
//  middleware/auth.php
//  Middleware de autenticación JWT
// ============================================================

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';

/**
 * Extrae el token Bearer de la cabecera Authorization.
 * Cubre los dos nombres que Apache puede usar según la configuración:
 *   - HTTP_AUTHORIZATION       (acceso directo o con la regla RewriteRule del .htaccess)
 *   - REDIRECT_HTTP_AUTHORIZATION  (cuando Apache hace reescritura interna)
 */
function obtenerToken(): ?string
{
    $cabecera = $_SERVER['HTTP_AUTHORIZATION']
             ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
             ?? '';

    // Soporte para apache_request_headers() como última alternativa
    if ($cabecera === '' && function_exists('apache_request_headers')) {
        $headers  = apache_request_headers();
        $cabecera = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!str_starts_with($cabecera, 'Bearer ')) {
        return null;
    }

    return substr($cabecera, 7);
}

/**
 * Extrae y valida el token JWT.
 * Si es válido devuelve el payload; si no, responde 401 y para.
 */
function autenticar(): array
{
    $token = obtenerToken();

    if ($token === null) {
        error('Token no proporcionado', 401);
    }

    try {
        return jwtVerificar($token);
    } catch (RuntimeException $e) {
        error($e->getMessage(), 401);
    }
}

/**
 * Igual que autenticar() pero no detiene la ejecución si no hay token.
 * Devuelve null si el usuario no está autenticado.
 */
function autenticarOpcional(): ?array
{
    $token = obtenerToken();

    if ($token === null) {
        return null;
    }

    try {
        return jwtVerificar($token);
    } catch (RuntimeException) {
        return null;
    }
}