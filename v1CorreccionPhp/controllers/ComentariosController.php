<?php
// ============================================================
//  controllers/ComentariosController.php
//  Gestiona los comentarios de los chollos en CholloPoint
//
//  GET    /chollos/{id}/comentarios    — Ver comentarios de un chollo
//  POST   /chollos/{id}/comentarios    — Publicar un comentario (requiere login)
//  DELETE /comentarios/{id}            — Borrar un comentario propio (requiere login)
//  POST   /comentarios/{id}/votar      — Votar un comentario (requiere login)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class ComentariosController
{
    // ── GET /chollos/{cholloId}/comentarios ───────────────────────────────────
    // Devuelve todos los comentarios de un chollo concreto
    public function listar($cholloId)
    {
        // Si hay sesión activa la obtenemos; si no, el usuario ve los comentarios igual
        $sesionUsuario = comprobarSesionOpcional();
        $bd            = conexionBaseDatos();

        // Obtenemos los comentarios junto con los datos básicos de quien los publicó
        $consultaComentarios = $bd->prepare(
            'SELECT c.id, c.texto, c.votos_positivos, c.votos_negativos, c.creado_en,
                    u.id     AS usuario_id,
                    u.nombre AS usuario,
                    u.avatar,
                    u.puntos
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.chollo_id = ?
             ORDER BY c.creado_en DESC'
        );
        $consultaComentarios->execute(array($cholloId));
        $listaComentarios = $consultaComentarios->fetchAll();

        // Si el usuario está logueado, añadimos a cada comentario si él mismo lo votó
        if ($sesionUsuario !== null) {
            $idUsuario = (int) $sesionUsuario['sub'];

            // Recorremos cada comentario y consultamos si este usuario lo ha votado
            for ($i = 0; $i < count($listaComentarios); $i++) {
                $idComentario = $listaComentarios[$i]['id'];

                $consultaVoto = $bd->prepare(
                    'SELECT tipo FROM votos_comentarios
                     WHERE usuario_id = ? AND comentario_id = ?'
                );
                $consultaVoto->execute(array($idUsuario, $idComentario));
                $votoEncontrado = $consultaVoto->fetch();

                if ($votoEncontrado) {
                    $listaComentarios[$i]['mi_voto'] = $votoEncontrado['tipo'];
                } else {
                    $listaComentarios[$i]['mi_voto'] = null;
                }
            }
        } else {
            // Si no hay sesión, todos los comentarios tienen mi_voto a null
            for ($i = 0; $i < count($listaComentarios); $i++) {
                $listaComentarios[$i]['mi_voto'] = null;
            }
        }

        responderExito(array('comentarios' => $listaComentarios));
    }


    // ── POST /chollos/{cholloId}/comentarios ──────────────────────────────────
    // Publica un comentario nuevo en un chollo
    public function crear($cholloId)
    {
        $sesionUsuario  = comprobarSesionActiva();
        $datosRecibidos = leerCuerpoJSON();
        $idUsuario      = (int) $sesionUsuario['sub'];

        comprobarCamposObligatorios($datosRecibidos, array('texto'));

        $textoComentario = trim($datosRecibidos['texto']);

        if (strlen($textoComentario) < 1) {
            responderError('El comentario no puede estar vacío');
        }

        $bd = conexionBaseDatos();

        // Comprobamos que el chollo al que queremos comentar existe
        $consultaChollo = $bd->prepare('SELECT id FROM chollos WHERE id = ?');
        $consultaChollo->execute(array($cholloId));
        $cholloExiste = $consultaChollo->fetch();

        if (!$cholloExiste) {
            responderError('No se encontró el chollo', 404);
        }

        // Guardamos el comentario en la base de datos
        $consultaInsertar = $bd->prepare(
            'INSERT INTO comentarios (chollo_id, usuario_id, texto) VALUES (?, ?, ?)'
        );
        $consultaInsertar->execute(array($cholloId, $idUsuario, $textoComentario));

        $idNuevoComentario = (int) $bd->lastInsertId();

        // Damos +2 puntos al usuario por comentar en CholloPoint
        $consultaPuntos = $bd->prepare(
            'UPDATE usuarios SET puntos = puntos + 2 WHERE id = ?'
        );
        $consultaPuntos->execute(array($idUsuario));

        // Obtenemos el comentario completo para devolvérselo al frontend
        $consultaNuevoComentario = $bd->prepare(
            'SELECT c.id, c.texto, c.votos_positivos, c.votos_negativos, c.creado_en,
                    u.id     AS usuario_id,
                    u.nombre AS usuario,
                    u.avatar,
                    u.puntos
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.id = ?'
        );
        $consultaNuevoComentario->execute(array($idNuevoComentario));
        $comentarioCreado = $consultaNuevoComentario->fetch();

        // El usuario que acaba de comentar aún no lo ha votado
        $comentarioCreado['mi_voto'] = null;

        responderExito(array('comentario' => $comentarioCreado), 'Comentario publicado (+2 puntos)');
    }


    // ── DELETE /comentarios/{id} ──────────────────────────────────────────────
    // Borra un comentario (solo lo puede hacer quien lo escribió)
    public function eliminar($idComentario)
    {
        $sesionUsuario = comprobarSesionActiva();
        $bd            = conexionBaseDatos();

        // Buscamos el comentario para saber quién lo escribió
        $consultaComentario = $bd->prepare('SELECT usuario_id FROM comentarios WHERE id = ?');
        $consultaComentario->execute(array($idComentario));
        $comentario = $consultaComentario->fetch();

        if (!$comentario) {
            responderError('No se encontró el comentario', 404);
        }

        // Solo el autor del comentario puede borrarlo
        $idAutor   = (int) $comentario['usuario_id'];
        $idSesion  = (int) $sesionUsuario['sub'];

        if ($idAutor !== $idSesion) {
            responderError('No tienes permiso para borrar este comentario', 403);
        }

        $consultaBorrar = $bd->prepare('DELETE FROM comentarios WHERE id = ?');
        $consultaBorrar->execute(array($idComentario));

        responderExito(null, 'Comentario eliminado');
    }


    // ── POST /comentarios/{id}/votar ──────────────────────────────────────────
    // Vota un comentario como positivo o negativo
    // Body JSON esperado: { "tipo": "positivo" }  o  { "tipo": "negativo" }
    public function votar($idComentario)
    {
        $sesionUsuario  = comprobarSesionActiva();
        $idUsuario      = (int) $sesionUsuario['sub'];
        $datosRecibidos = leerCuerpoJSON();
        $bd             = conexionBaseDatos();

        // Comprobamos que el tipo de voto es válido
        $tipoVoto = isset($datosRecibidos['tipo']) ? $datosRecibidos['tipo'] : '';

        if ($tipoVoto !== 'positivo' && $tipoVoto !== 'negativo') {
            responderError('El tipo de voto debe ser "positivo" o "negativo"');
        }

        // Buscamos el comentario para saber si existe y quién lo escribió
        $consultaComentario = $bd->prepare('SELECT id, usuario_id FROM comentarios WHERE id = ?');
        $consultaComentario->execute(array($idComentario));
        $comentario = $consultaComentario->fetch();

        if (!$comentario) {
            responderError('No se encontró el comentario', 404);
        }

        // Comprobamos si este usuario ya votó antes este comentario
        $consultaVotoPrevio = $bd->prepare(
            'SELECT id, tipo FROM votos_comentarios WHERE comentario_id = ? AND usuario_id = ?'
        );
        $consultaVotoPrevio->execute(array($idComentario, $idUsuario));
        $votoPrevio = $consultaVotoPrevio->fetch();

        if ($votoPrevio) {
            // El usuario ya votó este comentario antes

            if ($votoPrevio['tipo'] === $tipoVoto) {
                // Intentó votar igual que antes
                responderError('Ya has votado este comentario con ese tipo', 409);
            }

            // Cambió de voto: restamos el voto antiguo y sumamos el nuevo
            if ($votoPrevio['tipo'] === 'positivo') {
                $campoBajar = 'votos_positivos';
            } else {
                $campoBajar = 'votos_negativos';
            }

            if ($tipoVoto === 'positivo') {
                $campoSubir = 'votos_positivos';
            } else {
                $campoSubir = 'votos_negativos';
            }

            $consultaCambioVotos = $bd->prepare(
                "UPDATE comentarios
                 SET $campoBajar = GREATEST(0, $campoBajar - 1),
                     $campoSubir = $campoSubir + 1
                 WHERE id = ?"
            );
            $consultaCambioVotos->execute(array($idComentario));

            // Actualizamos el registro del voto con el nuevo tipo
            $consultaActualizarVoto = $bd->prepare(
                'UPDATE votos_comentarios SET tipo = ? WHERE id = ?'
            );
            $consultaActualizarVoto->execute(array($tipoVoto, $votoPrevio['id']));

        } else {
            // El usuario vota este comentario por primera vez

            if ($tipoVoto === 'positivo') {
                $campoSubir = 'votos_positivos';
            } else {
                $campoSubir = 'votos_negativos';
            }

            // Sumamos el voto al comentario
            $consultaVoto = $bd->prepare(
                "UPDATE comentarios SET $campoSubir = $campoSubir + 1 WHERE id = ?"
            );
            $consultaVoto->execute(array($idComentario));

            // Registramos el voto para que no pueda repetirlo
            $consultaRegistrarVoto = $bd->prepare(
                'INSERT INTO votos_comentarios (comentario_id, usuario_id, tipo) VALUES (?, ?, ?)'
            );
            $consultaRegistrarVoto->execute(array($idComentario, $idUsuario, $tipoVoto));

            // Si el voto es positivo, el autor del comentario gana 1 punto
            if ($tipoVoto === 'positivo') {
                $idAutorComentario = (int) $comentario['usuario_id'];

                $consultaPuntos = $bd->prepare(
                    'UPDATE usuarios SET puntos = puntos + 1 WHERE id = ?'
                );
                $consultaPuntos->execute(array($idAutorComentario));
            }
        }

        // Devolvemos los conteos actualizados al frontend
        $consultaTotales = $bd->prepare(
            'SELECT votos_positivos, votos_negativos FROM comentarios WHERE id = ?'
        );
        $consultaTotales->execute(array($idComentario));
        $totalesActualizados = $consultaTotales->fetch();

        $respuesta = array(
            'positivos' => (int) $totalesActualizados['votos_positivos'],
            'negativos' => (int) $totalesActualizados['votos_negativos'],
            'mi_voto'   => $tipoVoto,
        );

        responderExito($respuesta, 'Voto registrado');
    }
}