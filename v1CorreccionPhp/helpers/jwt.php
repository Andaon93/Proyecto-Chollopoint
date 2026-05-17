<?php

define('CLAVE_SECRETA_TOKEN', 'CAMBIA_ESTO_POR_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA');

define('DURACION_SESION', 60 * 60 * 24 * 7);

function codificarBase64Url($datos)
{
    $base64Normal  = base64_encode($datos);

    $sinMas        = str_replace('+', '-', $base64Normal);
    $sinBarra      = str_replace('/', '_', $sinMas);
    $sinIgualdad   = rtrim($sinBarra, '=');

    return $sinIgualdad;
}

function decodificarBase64Url($textoBase64Url)
{
   
    $conMas    = str_replace('-', '+', $textoBase64Url);
    $conBarra  = str_replace('_', '/', $conMas);

    return base64_decode($conBarra);
}


function generarTokenSesion($datosDelUsuario)
{
   
    $infoCabecera      = array('alg' => 'HS256', 'typ' => 'JWT');
    $cabeceraJSON      = json_encode($infoCabecera);
    $cabeceraCodificada = codificarBase64Url($cabeceraJSON);

    
    $datosDelUsuario['iat'] = time();
    $datosDelUsuario['exp'] = time() + DURACION_SESION;

    
    $payloadJSON       = json_encode($datosDelUsuario);
    $payloadCodificado = codificarBase64Url($payloadJSON);

    $textoAFirmar    = $cabeceraCodificada . '.' . $payloadCodificado;
    $firmaHash       = hash_hmac('sha256', $textoAFirmar, CLAVE_SECRETA_TOKEN, true);
    $firmaCodificada = codificarBase64Url($firmaHash);

    
    $tokenCompleto = $cabeceraCodificada . '.' . $payloadCodificado . '.' . $firmaCodificada;

    return $tokenCompleto;
}


function verificarTokenSesion($token)
{
    
    $partes = explode('.', $token);

    if (count($partes) !== 3) {
        throw new RuntimeException('El formato del token no es correcto');
    }

    $cabeceraCodificada  = $partes[0];
    $payloadCodificado   = $partes[1];
    $firmaQueViene       = $partes[2];

    
    $textoOriginal       = $cabeceraCodificada . '.' . $payloadCodificado;
    $firmaHash           = hash_hmac('sha256', $textoOriginal, CLAVE_SECRETA_TOKEN, true);
    $firmaQueDeberiaHaber = codificarBase64Url($firmaHash);

   
    if (!hash_equals($firmaQueDeberiaHaber, $firmaQueViene)) {
        throw new RuntimeException('La firma del token no es válida');
    }

   
    $payloadJSON  = decodificarBase64Url($payloadCodificado);
    $datosSesion  = json_decode($payloadJSON, true);

    if (!$datosSesion) {
        throw new RuntimeException('No se pudieron leer los datos del token');
    }

    
    if ($datosSesion['exp'] < time()) {
        throw new RuntimeException('Tu sesión ha caducado, vuelve a iniciar sesión');
    }

    return $datosSesion;
}
