<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class ChollosController
{
    public function listar()
    {
        $bd = conexionBaseDatos();
        $condicionesWhere = array();
        $valoresFiltros   = array();

        if (isset($_GET['solo_activos']) && $_GET['solo_activos'] === '0') {
            $soloActivos = false;
        } else {
            $soloActivos = true;
        }

        if ($soloActivos) {
            $condicionesWhere[] = 'c.activo = 1 AND c.expira_en > NOW()';
        }

        if (isset($_GET['con_coords']) && $_GET['con_coords'] === '1') {
            $condicionesWhere[] = 'c.latitud IS NOT NULL AND c.longitud IS NOT NULL';
        }

        if (isset($_GET['categoria']) && $_GET['categoria'] !== '') {
            $condicionesWhere[] = 'c.categoria = ?';
            $valoresFiltros[]   = $_GET['categoria'];
        }

        if (isset($_GET['ciudad']) && $_GET['ciudad'] !== '') {
            $condicionesWhere[] = 'c.ciudad = ?';
            $valoresFiltros[]   = $_GET['ciudad'];
        }

        if (isset($_GET['precio_min']) && $_GET['precio_min'] !== '') {
            $condicionesWhere[] = 'c.precio_oferta >= ?';
            $valoresFiltros[]   = (float)$_GET['precio_min'];
        }

        if (isset($_GET['precio_max']) && $_GET['precio_max'] !== '') {
            $condicionesWhere[] = 'c.precio_oferta <= ?';
            $valoresFiltros[]   = (float)$_GET['precio_max'];
        }

        $sql = 'SELECT c.*, u.nombre AS autor_nombre, u.avatar AS autor_avatar, u.puntos AS autor_puntos
                FROM chollos c
                JOIN usuarios u ON c.usuario_id = u.id';

        if (count($condicionesWhere) > 0) {
            $sql .= ' WHERE ' . implode(' AND ', $condicionesWhere);
        }

        $sql .= ' ORDER BY c.creado_en DESC';

        $consulta = $bd->prepare($sql);
        $consulta->execute($valoresFiltros);
        $chollos = $consulta->fetchAll();

        responderExito(array('chollos' => $chollos));
    }

    public function ver($id)
    {
        $bd = conexionBaseDatos();
        $consulta = $bd->prepare(
            'SELECT c.*, u.nombre AS autor_nombre, u.avatar AS autor_avatar, u.puntos AS autor_puntos
             FROM chollos c
             JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.id = ?'
        );
        $consulta->execute(array($id));
        $chollo = $consulta->fetch();

        if (!$chollo) {
            responderError('No se encontró el chollo', 404);
        }

        responderExito(array('chollo' => $chollo));
    }

    public function crear()
    {
        $sesionUsuario = comprobarSesionActiva();
        if (!$sesionUsuario || empty($sesionUsuario['sub'])) {
            responderError('No autorizado', 401);
        }
        $idUsuario = (int) $sesionUsuario['sub'];

        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            $data = array();
        }

        $titulo          = isset($data['titulo'])          ? trim($data['titulo'])            : null;
        $descripcion     = isset($data['descripcion'])     ? trim($data['descripcion'])       : '';
        $precio_original = isset($data['precio_original']) ? (float)$data['precio_original'] : 0;
        $precio_oferta   = isset($data['precio_oferta'])   ? (float)$data['precio_oferta']   : 0;
        $tienda          = isset($data['tienda'])          ? trim($data['tienda'])            : '';
        $enlace          = isset($data['enlace'])          ? trim($data['enlace'])            : '';
        $categoria       = isset($data['categoria'])       ? $data['categoria']               : 'Otros';
        $ciudad          = isset($data['ciudad'])          ? $data['ciudad']                  : null;
        $comunidad       = isset($data['comunidad'])       ? $data['comunidad']               : null;
        $latitud         = isset($data['latitud'])         ? $data['latitud']                 : null;
        $longitud        = isset($data['longitud'])        ? $data['longitud']                : null;
        $publicado_por   = isset($sesionUsuario['nombre']) ? $sesionUsuario['nombre']         : 'Anónimo';

        if (!$titulo || $titulo === '') {
            responderError("El campo 'titulo' es obligatorio");
        }

        $rutaImagen = isset($data['imagen']) && trim($data['imagen']) !== ''
            ? trim($data['imagen'])
            : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600";

        $descuento = null;
        if ($precio_original > 0 && $precio_oferta > 0) {
            $porcentaje = round((1 - ($precio_oferta / $precio_original)) * 100);
            $descuento  = "-" . $porcentaje . "%";
        }

        $bd = conexionBaseDatos();
        $consulta = $bd->prepare(
            'INSERT INTO chollos (
                titulo, descripcion, precio_original, precio_oferta, descuento,
                tienda, enlace, imagen, categoria, ciudad, comunidad,
                latitud, longitud, usuario_id, publicado_por, expira_en
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))'
        );

        $consulta->execute(array(
            $titulo, $descripcion, $precio_original, $precio_oferta, $descuento,
            $tienda, $enlace, $rutaImagen, $categoria, $ciudad, $comunidad,
            $latitud, $longitud, $idUsuario, $publicado_por
        ));

        $idNuevoChollo = $bd->lastInsertId();
        responderExito(array('id' => $idNuevoChollo), 'Chollo publicado con éxito', 201);
    }

    public function editar($id)
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];

        $data = !empty($_POST) ? $_POST : json_decode(file_get_contents("php://input"), true);

        $bd = conexionBaseDatos();

        
        $consultaRol = $bd->prepare('SELECT rol FROM usuarios WHERE id = ?');
        $consultaRol->execute(array($idUsuario));
        $datosRol = $consultaRol->fetch();
        $esAdmin  = ($datosRol && $datosRol['rol'] === 'admin');

        $consultaAutor = $bd->prepare('SELECT usuario_id FROM chollos WHERE id = ?');
        $consultaAutor->execute(array($id));
        $chollo = $consultaAutor->fetch();

        
        if (!$chollo || ((int)$chollo['usuario_id'] !== $idUsuario && !$esAdmin)) {
            responderError('No tienes permiso para editar este chollo', 403);
        }

        $consultaUpdate = $bd->prepare(
            'UPDATE chollos SET titulo = ?, descripcion = ?, precio_original = ?, precio_oferta = ?, tienda = ?, enlace = ?, imagen = ? WHERE id = ?'
        );
        $consultaUpdate->execute(array(
            $data['titulo'],
            $data['descripcion'],
            $data['precio_original'],
            $data['precio_oferta'],
            $data['tienda'],
            isset($data['enlace']) ? trim($data['enlace']) : '',
            isset($data['imagen']) && trim($data['imagen']) !== ''
                ? trim($data['imagen'])
                : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
            $id
        ));

        responderExito(null, 'Chollo actualizado correctamente');
    }

    public function eliminar($id)
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];

        $bd = conexionBaseDatos();

        
        $consultaRol = $bd->prepare('SELECT rol FROM usuarios WHERE id = ?');
        $consultaRol->execute(array($idUsuario));
        $datosRol = $consultaRol->fetch();
        $esAdmin  = ($datosRol && $datosRol['rol'] === 'admin');

        $consultaAutor = $bd->prepare('SELECT usuario_id FROM chollos WHERE id = ?');
        $consultaAutor->execute(array($id));
        $chollo = $consultaAutor->fetch();

        
        if (!$chollo || ((int)$chollo['usuario_id'] !== $idUsuario && !$esAdmin)) {
            responderError('No tienes permiso para eliminar este chollo', 403);
        }

        $consultaBorrar = $bd->prepare('DELETE FROM chollos WHERE id = ?');
        $consultaBorrar->execute(array($id));

        responderExito(null, 'Chollo eliminado');
    }

    public function votar($idChollo)
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];
        $data          = json_decode(file_get_contents("php://input"), true);
        $tipoVoto      = $data['tipo'] ?? null;

        if (!in_array($tipoVoto, ['positivo', 'negativo'])) {
            responderError('Tipo de voto no válido');
        }

        $bd = conexionBaseDatos();
        $consultaChollo = $bd->prepare('SELECT usuario_id FROM chollos WHERE id = ?');
        $consultaChollo->execute(array($idChollo));
        $chollo = $consultaChollo->fetch();

        if (!$chollo) responderError('Chollo no encontrado', 404);

        $consultaVotoPrevio = $bd->prepare('SELECT id, tipo FROM votos_chollos WHERE chollo_id = ? AND usuario_id = ?');
        $consultaVotoPrevio->execute(array($idChollo, $idUsuario));
        $votoPrevio = $consultaVotoPrevio->fetch();

        if ($votoPrevio) {
            if ($votoPrevio['tipo'] === $tipoVoto) {
                responderError('Ya has votado lo mismo');
            }
            $campoQuitar = ($votoPrevio['tipo'] === 'positivo') ? 'votos_positivos' : 'votos_negativos';
            $campoAñadir = ($tipoVoto === 'positivo') ? 'votos_positivos' : 'votos_negativos';

            $consultaCambioVotos = $bd->prepare("UPDATE chollos SET $campoQuitar = $campoQuitar - 1, $campoAñadir = $campoAñadir + 1 WHERE id = ?");
            $consultaCambioVotos->execute(array($idChollo));
            $consultaActualizarVoto = $bd->prepare('UPDATE votos_chollos SET tipo = ? WHERE id = ?');
            $consultaActualizarVoto->execute(array($tipoVoto, $votoPrevio['id']));
        } else {
            $campoSubir = ($tipoVoto === 'positivo') ? 'votos_positivos' : 'votos_negativos';
            $consultaVoto = $bd->prepare("UPDATE chollos SET $campoSubir = $campoSubir + 1 WHERE id = ?");
            $consultaVoto->execute(array($idChollo));
            $consultaRegistrarVoto = $bd->prepare('INSERT INTO votos_chollos (chollo_id, usuario_id, tipo) VALUES (?, ?, ?)');
            $consultaRegistrarVoto->execute(array($idChollo, $idUsuario, $tipoVoto));

            if ($tipoVoto === 'positivo') {
                $idAutorChollo = (int) $chollo['usuario_id'];
                $consultaPuntos = $bd->prepare('UPDATE usuarios SET puntos = puntos + 1 WHERE id = ?');
                $consultaPuntos->execute(array($idAutorChollo));
            }
        }

        $consultaTotales = $bd->prepare('SELECT votos_positivos, votos_negativos FROM chollos WHERE id = ?');
        $consultaTotales->execute(array($idChollo));
        $totalesActualizados = $consultaTotales->fetch();

        responderExito(array(
            'positivos' => (int) $totalesActualizados['votos_positivos'],
            'negativos' => (int) $totalesActualizados['votos_negativos'],
            'mi_voto'   => $tipoVoto
        ));
    }
}
