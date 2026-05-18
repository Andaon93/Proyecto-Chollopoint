<?php
 
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';
 
 
class AuthController
{
   
    public function registro()
    {
        $datosRecibidos = leerCuerpoJSON();
 
        comprobarCamposObligatorios($datosRecibidos, array('nombre', 'email', 'password'));
 
        $nombre    = trim($datosRecibidos['nombre']);
        $email     = strtolower(trim($datosRecibidos['email']));
        $password  = $datosRecibidos['password'];
 
        if (strlen($nombre) < 2) {
            responderError('El nombre debe tener al menos 2 caracteres');
        }
 
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            responderError('El correo electrónico no tiene un formato válido');
        }
 
        if (strlen($password) < 6) {
            responderError('La contraseña debe tener al menos 6 caracteres');
        }
 
        $bd = conexionBaseDatos();
 
        $consultaEmail = $bd->prepare('SELECT id FROM usuarios WHERE email = ?');
        $consultaEmail->execute(array($email));
        $usuarioExistente = $consultaEmail->fetch();
 
        if ($usuarioExistente) {
            responderError('Ya existe una cuenta con ese correo electrónico', 409);
        }
 
        $passwordCifrada = password_hash($password, PASSWORD_BCRYPT);
        $letraAvatar     = strtoupper(mb_substr($nombre, 0, 1));
 
        $consultaInsertar = $bd->prepare(
            'INSERT INTO usuarios (nombre, email, password_hash, avatar, puntos)
             VALUES (?, ?, ?, ?, 0)'
        );
        $consultaInsertar->execute(array($nombre, $email, $passwordCifrada, $letraAvatar));
 
        $idNuevoUsuario = (int) $bd->lastInsertId();
        $datosUsuario   = $this->buscarUsuarioPorId($idNuevoUsuario);
 
        $datosSesion = array('sub' => $idNuevoUsuario, 'email' => $email);
        $token       = generarTokenSesion($datosSesion);
 
        responderExito(array('usuario' => $datosUsuario, 'token' => $token), 'Cuenta creada correctamente, ¡bienvenido a CholloPoint!');
    }
 
    public function login()
    {
        $datosRecibidos = leerCuerpoJSON();
 
        comprobarCamposObligatorios($datosRecibidos, array('email', 'password'));
 
        $email    = strtolower(trim($datosRecibidos['email']));
        $password = $datosRecibidos['password'];
 
        $bd = conexionBaseDatos();
 
        $consultaUsuario = $bd->prepare('SELECT * FROM usuarios WHERE email = ?');
        $consultaUsuario->execute(array($email));
        $usuario = $consultaUsuario->fetch();
 
        if (!$usuario) {
            responderError('El correo o la contraseña no son correctos', 401);
        }
 
        $passwordCorrecta = password_verify($password, $usuario['password_hash']);
 
        if (!$passwordCorrecta) {
            responderError('El correo o la contraseña no son correctos', 401);
        }
 
        unset($usuario['password_hash']);
 
        $datosSesion = array('sub' => $usuario['id'], 'email' => $usuario['email']);
        $token       = generarTokenSesion($datosSesion);
 
        responderExito(array('usuario' => $usuario, 'token' => $token), 'Has iniciado sesión correctamente');
    }
 
    public function me()
    {
        $datosSesion  = comprobarSesionActiva();
        $idUsuario    = (int) $datosSesion['sub'];
        $datosUsuario = $this->buscarUsuarioPorId($idUsuario);
 
        responderExito(array('usuario' => $datosUsuario));
    }
 
 
    private function buscarUsuarioPorId($idUsuario)
    {
        $bd = conexionBaseDatos();

        $consulta = $bd->prepare(
            'SELECT id, nombre, alias, email, avatar, puntos,
                    bio, ciudad, provincia, telefono, fecha_nac,
                    color_avatar, fecha_registro, rol
             FROM usuarios WHERE id = ?'
        );
        $consulta->execute(array($idUsuario));
        $usuario = $consulta->fetch();
 
        if (!$usuario) {
            responderError('No se encontró el usuario', 404);
        }
 
        return $usuario;
    }
}
