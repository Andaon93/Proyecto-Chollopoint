<?php


require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';

function buscarTokenEnCabeceras()
{
    $cabecera = '';

    if (isset($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] !== '') {
        $cabecera = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] !== '') {
        $cabecera = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        
        $todasLasCabeceras = apache_request_headers();

        if (isset($todasLasCabeceras['Authorization'])) {
            $cabecera = $todasLasCabeceras['Authorization'];
        } elseif (isset($todasLasCabeceras['authorization'])) {
            $cabecera = $todasLasCabeceras['authorization'];
        }
    }

   
    if (substr($cabecera, 0, 7) !== 'Bearer ') {
        return null;
    }

    $soloElToken = substr($cabecera, 7);

    return $soloElToken;
}

function comprobarSesionActiva()
{
    $token = buscarTokenEnCabeceras();

    if ($token === null) {
        responderError('Necesitas iniciar sesión para realizar esta acción', 401);
    }

    try {
        $datosSesion = verificarTokenSesion($token);
        return $datosSesion;
    } catch (RuntimeException $error) {
        responderError($error->getMessage(), 401);
    }
}


function comprobarSesionOpcional()
{
    $token = buscarTokenEnCabeceras();

    if ($token === null) {
        return null;
    }

    try {
        $datosSesion = verificarTokenSesion($token);
        return $datosSesion;
    } catch (RuntimeException $error) {
        return null;
    }
}
