<?php
// ============================================================
//  controllers/UsuariosController.php
//  Gestiona los perfiles de usuarios de CholloPoint
//
//  GET  /usuarios/{id}       — Ver perfil público de un usuario
//  PUT  /usuarios/me         — Editar mi propio perfil (requiere login)
//  POST /usuarios/me/puntos  — Sumar o restar puntos a mi cuenta (requiere login)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class UsuariosController
{
    // ── GET /usuarios/{id} ────────────────────────────────────────────────────
    // Devuelve el perfil público de cualquier usuario de CholloPoint
    // No requiere login porque los perfiles son públicos
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


    // ── PUT /usuarios/me ──────────────────────────────────────────────────────
    // Permite al usuario logueado editar los datos de su propio perfil
    public function actualizar()
    {
        $sesionUsuario  = comprobarSesionActiva();
        $datosRecibidos = leerCuerpoJSON();
        $idUsuario      = (int) $sesionUsuario['sub'];

        // Lista de campos que el usuario puede cambiar desde el frontend
        // Si intentara enviar otros campos (como "puntos" o "id") los ignoramos
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

        // Construimos la consulta UPDATE solo con los campos que el usuario envió
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

        // Si cambia el nombre, también actualizamos la letra del avatar
        if (array_key_exists('nombre', $datosRecibidos)) {
            $nuevoNombre  = trim($datosRecibidos['nombre']);
            $nuevaLetra   = strtoupper(mb_substr($nuevoNombre, 0, 1));
            $partesUpdate[]  = 'avatar = ?';
            $valoresUpdate[] = $nuevaLetra;
        }

        // Añadimos el ID del usuario al final (para el WHERE de la consulta)
        $valoresUpdate[] = $idUsuario;

        $consultaSQL = 'UPDATE usuarios SET ' . implode(', ', $partesUpdate) . ' WHERE id = ?';

        $bd = conexionBaseDatos();
        $consultaActualizar = $bd->prepare($consultaSQL);
        $consultaActualizar->execute($valoresUpdate);

        // Devolvemos el perfil actualizado (sin la contraseña cifrada)
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


    // ── POST /usuarios/me/puntos ──────────────────────────────────────────────
    // Suma o resta puntos al usuario logueado
    // Body JSON esperado: { "cantidad": 10 }   (puede ser negativo para restar)
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

        // Sumamos (o restamos si es negativo) los puntos
        // GREATEST(0, ...) evita que los puntos bajen de 0
        $consultaPuntos = $bd->prepare(
            'UPDATE usuarios
             SET puntos = GREATEST(0, puntos + ?)
             WHERE id = ?'
        );
        $consultaPuntos->execute(array($cantidad, $idUsuario));

        // Devolvemos el total de puntos actualizado
        $consultaTotalPuntos = $bd->prepare('SELECT puntos FROM usuarios WHERE id = ?');
        $consultaTotalPuntos->execute(array($idUsuario));
        $filaPuntos = $consultaTotalPuntos->fetch();

        responderExito(array('puntos' => (int) $filaPuntos['puntos']), 'Puntos actualizados');
    }
}