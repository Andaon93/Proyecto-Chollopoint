<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class FavoritosController
{
   
    public function listar()
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];
        $bd            = conexionBaseDatos();

        
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


    public function alternarFavorito($cholloId)
    {
        $sesionUsuario = comprobarSesionActiva();
        $idUsuario     = (int) $sesionUsuario['sub'];
        $bd            = conexionBaseDatos();

        $consultaChollo = $bd->prepare('SELECT id FROM chollos WHERE id = ?');
        $consultaChollo->execute(array($cholloId));
        $cholloExiste = $consultaChollo->fetch();

        if (!$cholloExiste) {
            responderError('No se encontró el chollo', 404);
        }

       
        $consultaFavorito = $bd->prepare(
            'SELECT id FROM favoritos WHERE usuario_id = ? AND chollo_id = ?'
        );
        $consultaFavorito->execute(array($idUsuario, $cholloId));
        $yaEsFavorito = $consultaFavorito->fetch();

        if ($yaEsFavorito) {
            
            $consultaBorrar = $bd->prepare(
                'DELETE FROM favoritos WHERE usuario_id = ? AND chollo_id = ?'
            );
            $consultaBorrar->execute(array($idUsuario, $cholloId));

            responderExito(array('favorito' => false), 'Chollo eliminado de favoritos');
        } else {
            $consultaAñadir = $bd->prepare(
                'INSERT INTO favoritos (usuario_id, chollo_id) VALUES (?, ?)'
            );
            $consultaAñadir->execute(array($idUsuario, $cholloId));

            responderExito(array('favorito' => true), 'Chollo añadido a favoritos');
        }
    }
}
