<?php
// ============================================================
//  controllers/AuthController.php
//  Gestiona el registro, el login y los datos del usuario
//  conectado actualmente en CholloPoint
//
//  POST /auth/registro  — Crear cuenta nueva
//  POST /auth/login     — Iniciar sesión
//  GET  /auth/me        — Ver datos de mi cuenta
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';


class AuthController
{
    // ── POST /auth/registro ──────────────────────────────────────────────────
    // Crea una cuenta nueva en CholloPoint
    public function registro()
    {
        // Leemos los datos que envía el frontend (nombre, email, contraseña)
        $datosRecibidos = leerCuerpoJSON();

        // Comprobamos que no falta ningún campo obligatorio
        comprobarCamposObligatorios($datosRecibidos, array('nombre', 'email', 'password'));

        $nombre    = trim($datosRecibidos['nombre']);
        $email     = strtolower(trim($datosRecibidos['email']));
        $password  = $datosRecibidos['password'];

        // Validaciones básicas antes de guardar nada en la base de datos
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

        // Comprobamos que no haya ya una cuenta con ese email
        $consultaEmail = $bd->prepare('SELECT id FROM usuarios WHERE email = ?');
        $consultaEmail->execute(array($email));
        $usuarioExistente = $consultaEmail->fetch();

        if ($usuarioExistente) {
            responderError('Ya existe una cuenta con ese correo electrónico', 409);
        }

        // Ciframos la contraseña antes de guardarla (NUNCA se guarda en texto plano)
        $passwordCifrada = password_hash($password, PASSWORD_BCRYPT);

        // El avatar por defecto es la primera letra del nombre en mayúscula
        $letraAvatar = strtoupper(mb_substr($nombre, 0, 1));

        // Guardamos el nuevo usuario en la base de datos
        $consultaInsertar = $bd->prepare(
            'INSERT INTO usuarios (nombre, email, password_hash, avatar, puntos)
             VALUES (?, ?, ?, ?, 0)'
        );
        $consultaInsertar->execute(array($nombre, $email, $passwordCifrada, $letraAvatar));

        $idNuevoUsuario = (int) $bd->lastInsertId();

        // Obtenemos los datos completos del usuario recién creado
        $datosUsuario = $this->buscarUsuarioPorId($idNuevoUsuario);

        // Generamos el token de sesión para que el usuario ya quede logueado
        $datosSesion = array('sub' => $idNuevoUsuario, 'email' => $email);
        $token       = generarTokenSesion($datosSesion);

        responderExito(array('usuario' => $datosUsuario, 'token' => $token), 'Cuenta creada correctamente, ¡bienvenido a CholloPoint!');
    }


    // ── POST /auth/login ─────────────────────────────────────────────────────
    // Inicia sesión con email y contraseña
    public function login()
    {
        $datosRecibidos = leerCuerpoJSON();

        comprobarCamposObligatorios($datosRecibidos, array('email', 'password'));

        $email    = strtolower(trim($datosRecibidos['email']));
        $password = $datosRecibidos['password'];

        $bd = conexionBaseDatos();

        // Buscamos al usuario por su email
        $consultaUsuario = $bd->prepare('SELECT * FROM usuarios WHERE email = ?');
        $consultaUsuario->execute(array($email));
        $usuario = $consultaUsuario->fetch();

        // Si no existe el usuario, mostramos error genérico (por seguridad no decimos cuál falló)
        if (!$usuario) {
            responderError('El correo o la contraseña no son correctos', 401);
        }

        // Comprobamos si la contraseña introducida coincide con la cifrada guardada
        $passwordCorrecta = password_verify($password, $usuario['password_hash']);

        if (!$passwordCorrecta) {
            responderError('El correo o la contraseña no son correctos', 401);
        }

        // Quitamos el hash de la contraseña del array antes de enviarlo al frontend
        unset($usuario['password_hash']);

        // Generamos el token de sesión
        $datosSesion = array('sub' => $usuario['id'], 'email' => $usuario['email']);
        $token       = generarTokenSesion($datosSesion);

        responderExito(array('usuario' => $usuario, 'token' => $token), 'Has iniciado sesión correctamente');
    }


    // ── GET /auth/me ─────────────────────────────────────────────────────────
    // Devuelve los datos de la cuenta del usuario que está logueado ahora mismo
    public function me()
    {
        // Comprobamos que haya sesión activa y obtenemos sus datos
        $datosSesion = comprobarSesionActiva();
        $idUsuario   = (int) $datosSesion['sub'];

        $datosUsuario = $this->buscarUsuarioPorId($idUsuario);

        responderExito(array('usuario' => $datosUsuario));
    }


    // ── Función de apoyo: buscar un usuario por su ID ─────────────────────────
    // La usamos dentro de este controlador para no repetir la misma consulta SQL
    private function buscarUsuarioPorId($idUsuario)
    {
        $bd = conexionBaseDatos();

        $consulta = $bd->prepare(
            'SELECT id, nombre, alias, email, avatar, puntos,
                    bio, ciudad, provincia, telefono, fecha_nac,
                    color_avatar, fecha_registro
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