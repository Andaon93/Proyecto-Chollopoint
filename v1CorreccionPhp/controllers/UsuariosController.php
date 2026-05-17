<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class UsuariosController
{
   
    public function ver($idUsuario)
    {
        $bd = conexionBaseDatos();

        $consultaUsuario = $bd->prepare(
            'SELECT id, nombre, alias, avatar, puntos, bio, ciudad, provincia,
                    color_avatar, fecha_registro
             FROM usuarios WHERE id = ?'
        );
        $consultaUsuario->execute(array($idUsuario));
        $usuario = $consultaUsuario->fetch();

        if (!$usuario) {
            responderError('No se encontró el usuario', 404);
        }

        responderExito(array('usuario' => $usuario));
    }


    public function actualizar()
    {
        $sesionUsuario  = comprobarSesionActiva();
        $datosRecibidos = leerCuerpoJSON();
        $idUsuario      = (int) $sesionUsuario['sub'];

        $camposPermitidos = array(
            'nombre',
            'alias',
            'bio',
            'ciudad',
            'provincia',
            'telefono',
            'fecha_nac',
            'color_avatar',
        );

        $partesUpdate = array();
        $valoresUpdate = array();

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datosRecibidos)) {
                $partesUpdate[]  = $campo . ' = ?';
                $valoresUpdate[] = $datosRecibidos[$campo];
            }
        }

        if (count($partesUpdate) === 0) {
            responderError('No has enviado ningún campo para actualizar');
        }

        
        if (array_key_exists('nombre', $datosRecibidos)) {
            $nuevoNombre  = trim($datosRecibidos['nombre']);
            $nuevaLetra   = strtoupper(mb_substr($nuevoNombre, 0, 1));
            $partesUpdate[]  = 'avatar = ?';
            $valoresUpdate[] = $nuevaLetra;
        }

       
        $valoresUpdate[] = $idUsuario;

        $consultaSQL = 'UPDATE usuarios SET ' . implode(', ', $partesUpdate) . ' WHERE id = ?';

        $bd = conexionBaseDatos();
        $consultaActualizar = $bd->prepare($consultaSQL);
        $consultaActualizar->execute($valoresUpdate);

        
        $consultaUsuario = $bd->prepare(
            'SELECT id, nombre, alias, email, avatar, puntos,
                    bio, ciudad, provincia, telefono, fecha_nac,
                    color_avatar, fecha_registro
             FROM usuarios WHERE id = ?'
        );
        $consultaUsuario->execute(array($idUsuario));
        $usuarioActualizado = $consultaUsuario->fetch();

        responderExito(array('usuario' => $usuarioActualizado), 'Perfil actualizado correctamente');
    }


    public function actualizarPuntos()
    {
        $sesionUsuario  = comprobarSesionActiva();
        $datosRecibidos = leerCuerpoJSON();
        $idUsuario      = (int) $sesionUsuario['sub'];

        $cantidad = (int) (isset($datosRecibidos['cantidad']) ? $datosRecibidos['cantidad'] : 0);

        if ($cantidad === 0) {
            responderError('La cantidad de puntos no puede ser 0');
        }

        $bd = conexionBaseDatos();

        $consultaPuntos = $bd->prepare(
            'UPDATE usuarios
             SET puntos = GREATEST(0, puntos + ?)
             WHERE id = ?'
        );
        $consultaPuntos->execute(array($cantidad, $idUsuario));

        
        $consultaTotalPuntos = $bd->prepare('SELECT puntos FROM usuarios WHERE id = ?');
        $consultaTotalPuntos->execute(array($idUsuario));
        $filaPuntos = $consultaTotalPuntos->fetch();

        responderExito(array('puntos' => (int) $filaPuntos['puntos']), 'Puntos actualizados');
    }
}
