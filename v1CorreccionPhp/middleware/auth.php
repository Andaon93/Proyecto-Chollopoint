<?php
// ============================================================
//  middleware/auth.php
//  Funciones para comprobar si el usuario ha iniciado sesión
//
//  Cuando el frontend hace una petición que requiere estar
//  logueado, envía el token JWT en la cabecera Authorization.
//  Estas funciones lo buscan, lo verifican y devuelven
//  los datos de la sesión del usuario.
// ============================================================

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';


// Busca el token JWT en las cabeceras HTTP de la petición
// Devuelve el token si lo encuentra, o null si no hay ninguno
function buscarTokenEnCabeceras()
{
    $cabecera = '';

    // Apache puede guardar la cabecera "Authorization" con distintos nombres
    // dependiendo de cómo esté configurado el servidor, así que miramos los dos sitios
    if (isset($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] !== '') {
        $cabecera = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] !== '') {
        $cabecera = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        // Última alternativa: pedirle las cabeceras directamente a Apache
        $todasLasCabeceras = apache_request_headers();

        if (isset($todasLasCabeceras['Authorization'])) {
            $cabecera = $todasLasCabeceras['Authorization'];
        } elseif (isset($todasLasCabeceras['authorization'])) {
            $cabecera = $todasLasCabeceras['authorization'];
        }
    }

    // El token siempre viene con el prefijo "Bearer " delante
    // Ejemplo: "Bearer eyJhbGc..."
    if (substr($cabecera, 0, 7) !== 'Bearer ') {
        return null;
    }

    // Quitamos el prefijo "Bearer " (7 caracteres) y devolvemos solo el token
    $soloElToken = substr($cabecera, 7);

    return $soloElToken;
}


// Comprueba que el usuario ha iniciado sesión
// Si todo está bien, devuelve los datos de su sesión (id, email, etc.)
// Si no hay token o es inválido, envía un error 401 y para la ejecución
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


// Igual que comprobarSesionActiva() pero sin cortar la ejecución si no hay token
// Se usa en rutas que pueden verse tanto logueado como sin loguearse
// (por ejemplo, ver chollos: sin login los ves igual, pero logueado ves tus favoritos)
// Devuelve los datos de sesión si está logueado, o null si no lo está
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
        // Si el token existe pero es inválido, simplemente tratamos al usuario como no logueado
        return null;
    }
}