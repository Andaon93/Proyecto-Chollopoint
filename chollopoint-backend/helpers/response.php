<?php
// ============================================================
//  helpers/response.php
//  Funciones para responder JSON de forma consistente
// ============================================================

/**
 * Responde con JSON y termina la ejecución.
 */
function responder(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok(mixed $data = null, string $mensaje = 'ok'): never
{
    responder(['ok' => true, 'mensaje' => $mensaje, 'data' => $data]);
}

function error(string $mensaje, int $status = 400): never
{
    responder(['ok' => false, 'error' => $mensaje], $status);
}

/**
 * Lee y decodifica el cuerpo JSON de la petición.
 */
function bodyJson(): array
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

/**
 * Valida que los campos requeridos estén presentes en $data.
 * Si falta alguno, responde con error 400 y para.
 */
function requeridos(array $data, array $campos): void
{
    foreach ($campos as $campo) {
        if (!isset($data[$campo]) || $data[$campo] === '') {
            error("El campo '$campo' es obligatorio");
        }
    }
}
