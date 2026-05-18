<?php


require_once __DIR__ . '/../config/database.php';

function limpiarChollosCaducados()
{
    $bd = conexionBaseDatos();

    $consulta = $bd->prepare(
        "DELETE FROM chollos
         WHERE expira_en < DATE_SUB(NOW(), INTERVAL 2 DAY)"
    );
    $consulta->execute();

    
    $chollosBorrados = $consulta->rowCount();

    return $chollosBorrados;
}



if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $cantidad = limpiarChollosCaducados();
    echo '[CholloPoint] Limpieza completada: ' . $cantidad . ' chollo(s) caducado(s) eliminado(s).' . PHP_EOL;
}
