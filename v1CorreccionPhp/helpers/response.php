<?php
// ============================================================
//  helpers/response.php
//  Funciones para enviar respuestas JSON al frontend de CholloPoint
//  Todas las respuestas siguen el mismo formato para que el
//  frontend siempre sepa qué esperar
// ============================================================


// Envía datos al frontend en formato JSON y para la ejecución del script
// Esta función la usan las demás, no se llama directamente desde los controladores
function enviarRespuesta($datos, $codigoHttp = 200)
{
    http_response_code($codigoHttp);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Envía una respuesta de éxito al frontend
// $datos    → lo que queremos devolver (un chollo, una lista, etc.)
// $mensaje  → texto descriptivo de lo que pasó
function responderExito($datos = null, $mensaje = 'ok')
{
    $respuesta = array(
        'ok'      => true,
        'mensaje' => $mensaje,
        'data'    => $datos,
    );

    enviarRespuesta($respuesta, 200);
}

// Envía una respuesta de error al frontend y para la ejecución
// $mensaje    → descripción del error para mostrar al usuario
// $codigoHttp → código de estado HTTP (400, 401, 403, 404, 409, 500...)
function responderError($mensaje, $codigoHttp = 400)
{
    $respuesta = array(
        'ok'    => false,
        'error' => $mensaje,
    );

    enviarRespuesta($respuesta, $codigoHttp);
}

// Lee el cuerpo de la petición HTTP y lo convierte de JSON a array de PHP
// El frontend envía los datos del formulario como texto JSON en el cuerpo
function leerCuerpoJSON()
{
    $textoCrudo = file_get_contents('php://input');

    if (!$textoCrudo) {
        return array();
    }

    $datos = json_decode($textoCrudo, true);

    if ($datos === null) {
        return array();
    }

    return $datos;
}

// Comprueba que los campos obligatorios están presentes en los datos recibidos
// Si falta alguno, envía un error 400 y para la ejecución
function comprobarCamposObligatorios($datos, $camposObligatorios)
{
    foreach ($camposObligatorios as $campo) {
        if (!isset($datos[$campo]) || $datos[$campo] === '') {
            responderError("El campo '$campo' es obligatorio");
        }
    }
}