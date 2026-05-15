<?php
// ============================================================
//  helpers/jwt.php
//  JWT manual (sin librerías externas) — HS256
// ============================================================

define('JWT_SECRET', 'CAMBIA_ESTO_POR_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA');
define('JWT_TTL',    60 * 60 * 24 * 7);   // 7 días en segundos

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Genera un JWT con el payload indicado.
 */
function jwtGenerar(array $payload): string
{
    $header  = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + JWT_TTL;
    $payload['iat'] = time();
    $pay     = base64UrlEncode(json_encode($payload));
    $firma   = base64UrlEncode(hash_hmac('sha256', "$header.$pay", JWT_SECRET, true));
    return "$header.$pay.$firma";
}

/**
 * Verifica y decodifica un JWT.
 * Devuelve el payload (array) o lanza una excepción.
 */
function jwtVerificar(string $token): array
{
    $partes = explode('.', $token);
    if (count($partes) !== 3) {
        throw new RuntimeException('Token inválido');
    }

    [$header, $pay, $firma] = $partes;
    $firmaEsperada = base64UrlEncode(hash_hmac('sha256', "$header.$pay", JWT_SECRET, true));

    if (!hash_equals($firmaEsperada, $firma)) {
        throw new RuntimeException('Firma inválida');
    }

    $payload = json_decode(base64UrlDecode($pay), true);

    if (!$payload || $payload['exp'] < time()) {
        throw new RuntimeException('Token expirado');
    }

    return $payload;
}
