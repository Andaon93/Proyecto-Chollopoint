<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class ComentariosController
{
  
    public function listar($cholloId)
    {
       
        $sesionUsuario = comprobarSesionOpcional();
        $bd            = conexionBaseDatos();

        
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

        
        if ($sesionUsuario !== null) {
            $idUsuario = (int) $sesionUsuario['sub'];
            
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
           
            for ($i = 0; $i < count($listaComentarios); $i++) {
                $listaComentarios[$i]['mi_voto'] = null;
            }
        }

        responderExito(array('comentarios' => $listaComentarios));
    }


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

        
        $consultaChollo = $bd->prepare('SELECT id FROM chollos WHERE id = ?');
        $consultaChollo->execute(array($cholloId));
        $cholloExiste = $consultaChollo->fetch();

        if (!$cholloExiste) {
            responderError('No se encontró el chollo', 404);
        }

        $consultaInsertar = $bd->prepare(
            'INSERT INTO comentarios (chollo_id, usuario_id, texto) VALUES (?, ?, ?)'
        );
        $consultaInsertar->execute(array($cholloId, $idUsuario, $textoComentario));

        $idNuevoComentario = (int) $bd->lastInsertId();

        $consultaPuntos = $bd->prepare(
            'UPDATE usuarios SET puntos = puntos + 2 WHERE id = ?'
        );
        $consultaPuntos->execute(array($idUsuario));

        
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

        
        $comentarioCreado['mi_voto'] = null;

        responderExito(array('comentario' => $comentarioCreado), 'Comentario publicado (+2 puntos)');
    }

    public function eliminar($idComentario)
    {
        $sesionUsuario = comprobarSesionActiva();
        $bd            = conexionBaseDatos();

        $consultaComentario = $bd->prepare('SELECT usuario_id FROM comentarios WHERE id = ?');
        $consultaComentario->execute(array($idComentario));
        $comentario = $consultaComentario->fetch();

        if (!$comentario) {
            responderError('No se encontró el comentario', 404);
        }

        $idAutor   = (int) $comentario['usuario_id'];
        $idSesion  = (int) $sesionUsuario['sub'];

        if ($idAutor !== $idSesion) {
            responderError('No tienes permiso para borrar este comentario', 403);
        }

        $consultaBorrar = $bd->prepare('DELETE FROM comentarios WHERE id = ?');
        $consultaBorrar->execute(array($idComentario));

        responderExito(null, 'Comentario eliminado');
    }

    public function votar($idComentario)
    {
        $sesionUsuario  = comprobarSesionActiva();
        $idUsuario      = (int) $sesionUsuario['sub'];
        $datosRecibidos = leerCuerpoJSON();
        $bd             = conexionBaseDatos();

        $tipoVoto = isset($datosRecibidos['tipo']) ? $datosRecibidos['tipo'] : '';

        if ($tipoVoto !== 'positivo' && $tipoVoto !== 'negativo') {
            responderError('El tipo de voto debe ser "positivo" o "negativo"');
        }

        $consultaComentario = $bd->prepare('SELECT id, usuario_id FROM comentarios WHERE id = ?');
        $consultaComentario->execute(array($idComentario));
        $comentario = $consultaComentario->fetch();

        if (!$comentario) {
            responderError('No se encontró el comentario', 404);
        }

        $consultaVotoPrevio = $bd->prepare(
            'SELECT id, tipo FROM votos_comentarios WHERE comentario_id = ? AND usuario_id = ?'
        );
        $consultaVotoPrevio->execute(array($idComentario, $idUsuario));
        $votoPrevio = $consultaVotoPrevio->fetch();

        if ($votoPrevio) {

            if ($votoPrevio['tipo'] === $tipoVoto) {
                responderError('Ya has votado este comentario con ese tipo', 409);
            }

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

            $consultaActualizarVoto = $bd->prepare(
                'UPDATE votos_comentarios SET tipo = ? WHERE id = ?'
            );
            $consultaActualizarVoto->execute(array($tipoVoto, $votoPrevio['id']));

        } else {

            if ($tipoVoto === 'positivo') {
                $campoSubir = 'votos_positivos';
            } else {
                $campoSubir = 'votos_negativos';
            }

            $consultaVoto = $bd->prepare(
                "UPDATE comentarios SET $campoSubir = $campoSubir + 1 WHERE id = ?"
            );
            $consultaVoto->execute(array($idComentario));

            $consultaRegistrarVoto = $bd->prepare(
                'INSERT INTO votos_comentarios (comentario_id, usuario_id, tipo) VALUES (?, ?, ?)'
            );
            $consultaRegistrarVoto->execute(array($idComentario, $idUsuario, $tipoVoto));

            if ($tipoVoto === 'positivo') {
                $idAutorComentario = (int) $comentario['usuario_id'];

                $consultaPuntos = $bd->prepare(
                    'UPDATE usuarios SET puntos = puntos + 1 WHERE id = ?'
                );
                $consultaPuntos->execute(array($idAutorComentario));
            }
        }

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
