<?php
// ============================================================
//  controllers/FavoritosController.php
//  Gestiona los chollos guardados como favoritos por el usuario
//
//  GET  /favoritos        — Ver mis chollos favoritos (requiere login)
//  POST /favoritos/{id}   — Guardar o quitar un chollo de favoritos (requiere login)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class FavoritosController
{
    // ── GET /favoritos ────────────────────────────────────────────────────────
    // Devuelve todos los chollos que el usuario tiene guardados como favoritos
    public function listar()
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];
        $bd            = conexionBaseDatos();

        // Obtenemos los chollos favoritos del usuario ordenados del más reciente al más antiguo
        $consultaFavoritos = $bd->prepare(
            'SELECT c.*
             FROM favoritos f
             JOIN chollos c ON c.id = f.chollo_id
             WHERE f.usuario_id = ?
             ORDER BY f.creado_en DESC'
        );
        $consultaFavoritos->execute(array($idUsuario));
        $listaDeFavoritos = $consultaFavoritos->fetchAll();

        responderExito(array('favoritos' => $listaDeFavoritos));
    }


    // ── POST /favoritos/{cholloId} ────────────────────────────────────────────
    // Guarda o quita un chollo de favoritos (funciona como un interruptor)
    // Si el chollo ya era favorito lo quita; si no lo era lo añade
    public function alternarFavorito($cholloId)
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];
        $bd            = conexionBaseDatos();

        // Comprobamos que el chollo existe antes de añadirlo a favoritos
        $consultaChollo = $bd->prepare('SELECT id FROM chollos WHERE id = ?');
        $consultaChollo->execute(array($cholloId));
        $cholloExiste = $consultaChollo->fetch();

        if (!$cholloExiste) {
            responderError('No se encontró el chollo', 404);
        }

        // Comprobamos si este chollo ya está en los favoritos del usuario
        $consultaFavorito = $bd->prepare(
            'SELECT id FROM favoritos WHERE usuario_id = ? AND chollo_id = ?'
        );
        $consultaFavorito->execute(array($idUsuario, $cholloId));
        $yaEsFavorito = $consultaFavorito->fetch();

        if ($yaEsFavorito) {
            // Ya era favorito → lo quitamos
            $consultaBorrar = $bd->prepare(
                'DELETE FROM favoritos WHERE usuario_id = ? AND chollo_id = ?'
            );
            $consultaBorrar->execute(array($idUsuario, $cholloId));

            responderExito(array('favorito' => false), 'Chollo eliminado de favoritos');
        } else {
            // No era favorito → lo añadimos
            $consultaAñadir = $bd->prepare(
                'INSERT INTO favoritos (usuario_id, chollo_id) VALUES (?, ?)'
            );
            $consultaAñadir->execute(array($idUsuario, $cholloId));

            responderExito(array('favorito' => true), 'Chollo añadido a favoritos');
        }
    }
}