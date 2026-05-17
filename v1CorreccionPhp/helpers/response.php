<?php

function enviarRespuesta($datos, $codigoHttp = 200)
{
    http_response_code($codigoHttp);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function responderExito($datos = null, $mensaje = 'ok')
{
    $respuesta = array(
        'ok'      => true,
        'mensaje' => $mensaje,
        'data'    => $datos,
    );

    enviarRespuesta($respuesta, 200);
}

function responderError($mensaje, $codigoHttp = 400)
{
    $respuesta = array(
        'ok'    => false,
        'error' => $mensaje,
    );

    enviarRespuesta($respuesta, $codigoHttp);
}

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

function comprobarCamposObligatorios($datos, $camposObligatorios)
{
    foreach ($camposObligatorios as $campo) {
        if (!isset($datos[$campo]) || $datos[$campo] === '') {
            responderError("El campo '$campo' es obligatorio");
        }
    }
}
