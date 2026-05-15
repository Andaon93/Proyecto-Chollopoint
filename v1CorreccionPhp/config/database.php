<?php
// ============================================================
//  config/database.php
//  Configuración de la conexión a la base de datos MySQL
//  de CholloPoint
// ============================================================

// Datos de acceso a la base de datos
// Estos valores deben coincidir con los del docker-compose.yml
define('BD_SERVIDOR',    'db');
define('BD_PUERTO',      '3306');
define('BD_NOMBRE',      'chollopoint');
define('BD_USUARIO',     'chollouser');
define('BD_CONTRASENA',  'chollopass');
define('BD_CODIFICACION','utf8mb4');


// Devuelve la conexión a la base de datos de CholloPoint
// Si la conexión ya existe la reutiliza; si no, la crea
// (así no abrimos una conexión nueva en cada consulta)
function conexionBaseDatos()
{
    // Con "static" hacemos que la variable $conexion no se pierda entre llamadas
    // La primera vez será null y se creará la conexión
    // Las siguientes veces ya tendrá la conexión y la devuelve directamente
    static $conexion = null;

    if ($conexion === null) {
        // Construimos la cadena de conexión con todos los datos necesarios
        $cadenaConexion  = 'mysql:host=' . BD_SERVIDOR;
        $cadenaConexion .= ';port='     . BD_PUERTO;
        $cadenaConexion .= ';dbname='   . BD_NOMBRE;
        $cadenaConexion .= ';charset='  . BD_CODIFICACION;

        // Opciones de configuración de PDO para que funcione de forma segura
        $opciones = array(
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // Que lance errores si algo falla
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // Devolver filas como arrays asociativos
            PDO::ATTR_EMULATE_PREPARES   => false,                   // Usar prepared statements reales
        );

        try {
            $conexion = new PDO($cadenaConexion, BD_USUARIO, BD_CONTRASENA, $opciones);
        } catch (PDOException $error) {
            // Si no se puede conectar, informamos al frontend y paramos
            http_response_code(500);
            echo json_encode(array('error' => 'No se pudo conectar a la base de datos de CholloPoint'));
            exit;
        }
    }

    return $conexion;
}