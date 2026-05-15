<?php
// ============================================================
//  controllers/AuthController.php
//  POST /auth/registro  — Crear cuenta
//  POST /auth/login     — Iniciar sesión
//  GET  /auth/me        — Datos del usuario autenticado
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class AuthController
{
    // ── POST /auth/registro ──────────────────────────────────────────────────
    public function registro(): never
    {
        $data = bodyJson();
        requeridos($data, ['nombre', 'email', 'password']);

        $nombre   = trim($data['nombre']);
        $email    = strtolower(trim($data['email']));
        $password = $data['password'];

        // Validaciones básicas
        if (strlen($nombre) < 2) {
            error('El nombre debe tener al menos 2 caracteres');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error('El correo electrónico no es válido');
        }
        if (strlen($password) < 6) {
            error('La contraseña debe tener al menos 6 caracteres');
        }

        $db = getDB();

        // Comprobar que el email no esté en uso
        $stmt = $db->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            error('Ese correo ya está registrado', 409);
        }

        // Insertar usuario
        $hash   = password_hash($password, PASSWORD_BCRYPT);
        $avatar = strtoupper(mb_substr($nombre, 0, 1));

        $stmt = $db->prepare(
            'INSERT INTO usuarios (nombre, email, password_hash, avatar, puntos)
             VALUES (?, ?, ?, ?, 0)'
        );
        $stmt->execute([$nombre, $email, $hash, $avatar]);
        $userId = (int) $db->lastInsertId();

        $usuario = $this->fetchUsuario($userId);
        $token   = jwtGenerar(['sub' => $userId, 'email' => $email]);

        ok(['usuario' => $usuario, 'token' => $token], 'Registro exitoso');
    }

    // ── POST /auth/login ─────────────────────────────────────────────────────
    public function login(): never
    {
        $data = bodyJson();
        requeridos($data, ['email', 'password']);

        $email    = strtolower(trim($data['email']));
        $password = $data['password'];

        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();

        if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
            error('Correo o contraseña incorrectos', 401);
        }

        unset($usuario['password_hash']);
        $token = jwtGenerar(['sub' => $usuario['id'], 'email' => $usuario['email']]);

        ok(['usuario' => $usuario, 'token' => $token], 'Login exitoso');
    }

    // ── GET /auth/me ─────────────────────────────────────────────────────────
    public function me(): never
    {
        $payload = autenticar();
        $usuario = $this->fetchUsuario((int) $payload['sub']);
        ok(['usuario' => $usuario]);
    }

    // ── Helper privado ────────────────────────────────────────────────────────
    private function fetchUsuario(int $id): array
    {
        $db   = getDB();
        $stmt = $db->prepare(
            'SELECT id, nombre, alias, email, avatar, puntos,
                    bio, ciudad, provincia, telefono, fecha_nac,
                    color_avatar, fecha_registro
             FROM usuarios WHERE id = ?'
        );
        $stmt->execute([$id]);
        $u = $stmt->fetch();

        if (!$u) error('Usuario no encontrado', 404);
        return $u;
    }
}
