<?php
if (file_exists(__DIR__ . '/db_env.php')) {
    require_once __DIR__ . '/db_env.php';
}

define('BD_SERVIDOR',    getenv('MYSQLHOST')     ?: 'db');
define('BD_PUERTO',      getenv('MYSQLPORT')     ?: '3306');
define('BD_NOMBRE',      getenv('MYSQLDATABASE') ?: 'chollopoint');
define('BD_USUARIO',     getenv('MYSQLUSER')     ?: 'chollouser');
define('BD_CONTRASENA',  getenv('MYSQLPASSWORD') ?: 'chollopass');
define('BD_CODIFICACION','utf8mb4');

function conexionBaseDatos()
{
    static $conexion = null;

    if ($conexion === null) {
        $cadenaConexion  = 'mysql:host=' . BD_SERVIDOR;
        $cadenaConexion .= ';port='     . BD_PUERTO;
        $cadenaConexion .= ';dbname='   . BD_NOMBRE;
        $cadenaConexion .= ';charset='  . BD_CODIFICACION;

        $opciones = array(
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        );

        try {
            $conexion = new PDO($cadenaConexion, BD_USUARIO, BD_CONTRASENA, $opciones);
        } catch (PDOException $error) {
            http_response_code(500);
            echo json_encode(array('error' => 'No se pudo conectar a la base de datos de CholloPoint'));
            exit;
        }
    }

    return $conexion;
}