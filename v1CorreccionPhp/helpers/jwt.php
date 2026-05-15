<?php
// ============================================================
//  helpers/jwt.php
//  Crear y verificar tokens de sesión para CholloPoint
//  Un token JWT es como un carnet que identifica al usuario
//  Usamos el algoritmo HS256 para firmar los tokens
// ============================================================

// Clave secreta con la que firmamos los tokens — CÁMBIALA antes de subir a producción
define('CLAVE_SECRETA_TOKEN', 'CAMBIA_ESTO_POR_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA');

// Tiempo que dura el token antes de caducar (7 días en segundos)
define('DURACION_SESION', 60 * 60 * 24 * 7);


// ── Funciones de codificación ─────────────────────────────────────────────────

// Convierte datos a texto Base64 adaptado para usarse en URLs
// (Base64 normal usa + / = que dan problemas en URLs, esta versión los cambia)
function codificarBase64Url($datos)
{
    $base64Normal  = base64_encode($datos);

    // Cambiamos los caracteres que dan problemas en URLs
    $sinMas        = str_replace('+', '-', $base64Normal);
    $sinBarra      = str_replace('/', '_', $sinMas);
    $sinIgualdad   = rtrim($sinBarra, '=');

    return $sinIgualdad;
}

// Hace lo contrario: convierte texto Base64 de URL de vuelta a los datos originales
function decodificarBase64Url($textoBase64Url)
{
    // Deshacemos los cambios de caracteres
    $conMas    = str_replace('-', '+', $textoBase64Url);
    $conBarra  = str_replace('_', '/', $conMas);

    return base64_decode($conBarra);
}


// ── Función principal: crear token ────────────────────────────────────────────

// Genera un token JWT con los datos del usuario logueado
// El token tiene 3 partes separadas por puntos: cabecera.payload.firma
function generarTokenSesion($datosDelUsuario)
{
    // PARTE 1 — La cabecera indica qué tipo de token es y qué algoritmo usa
    $infoCabecera      = array('alg' => 'HS256', 'typ' => 'JWT');
    $cabeceraJSON      = json_encode($infoCabecera);
    $cabeceraCodificada = codificarBase64Url($cabeceraJSON);

    // Añadimos al payload cuándo se creó y cuándo caduca
    $datosDelUsuario['iat'] = time();
    $datosDelUsuario['exp'] = time() + DURACION_SESION;

    // PARTE 2 — El payload contiene los datos del usuario (id, email, etc.)
    $payloadJSON       = json_encode($datosDelUsuario);
    $payloadCodificado = codificarBase64Url($payloadJSON);

    // PARTE 3 — La firma garantiza que nadie ha modificado el token
    // Juntamos cabecera y payload con un punto, y los firmamos con la clave secreta
    $textoAFirmar    = $cabeceraCodificada . '.' . $payloadCodificado;
    $firmaHash       = hash_hmac('sha256', $textoAFirmar, CLAVE_SECRETA_TOKEN, true);
    $firmaCodificada = codificarBase64Url($firmaHash);

    // Devolvemos el token completo: las tres partes unidas por puntos
    $tokenCompleto = $cabeceraCodificada . '.' . $payloadCodificado . '.' . $firmaCodificada;

    return $tokenCompleto;
}


// ── Función principal: verificar token ───────────────────────────────────────

// Comprueba que un token es válido y devuelve los datos que contiene
// Si el token es inválido o ha caducado, lanza una excepción con el motivo
function verificarTokenSesion($token)
{
    // El token debe tener exactamente 3 partes separadas por puntos
    $partes = explode('.', $token);

    if (count($partes) !== 3) {
        throw new RuntimeException('El formato del token no es correcto');
    }

    $cabeceraCodificada  = $partes[0];
    $payloadCodificado   = $partes[1];
    $firmaQueViene       = $partes[2];

    // Calculamos la firma que DEBERÍA tener si no ha sido modificado
    $textoOriginal       = $cabeceraCodificada . '.' . $payloadCodificado;
    $firmaHash           = hash_hmac('sha256', $textoOriginal, CLAVE_SECRETA_TOKEN, true);
    $firmaQueDeberiaHaber = codificarBase64Url($firmaHash);

    // Comparamos la firma del token con la que calculamos nosotros
    // Usamos hash_equals en vez de == para evitar ataques de temporización
    if (!hash_equals($firmaQueDeberiaHaber, $firmaQueViene)) {
        throw new RuntimeException('La firma del token no es válida');
    }

    // Decodificamos el payload para leer los datos del usuario
    $payloadJSON  = decodificarBase64Url($payloadCodificado);
    $datosSesion  = json_decode($payloadJSON, true);

    if (!$datosSesion) {
        throw new RuntimeException('No se pudieron leer los datos del token');
    }

    // Comprobamos que el token no haya caducado
    if ($datosSesion['exp'] < time()) {
        throw new RuntimeException('Tu sesión ha caducado, vuelve a iniciar sesión');
    }

    return $datosSesion;
}