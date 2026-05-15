<?php
// ============================================================
//  controllers/UsuariosController.php
//  GET    /usuarios/{id}       — Ver perfil público
//  PUT    /usuarios/me         — Editar perfil propio
//  POST   /usuarios/me/puntos  — Sumar/restar puntos (interno)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class UsuariosController
{
    // ── GET /usuarios/{id} ────────────────────────────────────────────────────
    public function ver(int $id): never
    {
        $db   = getDB();
        $stmt = $db->prepare(
            'SELECT id, nombre, alias, avatar, puntos, bio, ciudad, provincia,
                    color_avatar, fecha_registro
             FROM usuarios WHERE id = ?'
        );
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) error('Usuario no encontrado', 404);

        ok(['usuario' => $usuario]);
    }

    // ── PUT /usuarios/me ──────────────────────────────────────────────────────
    public function actualizar(): never
    {
        $payload = autenticar();
        $data    = bodyJson();
        $userId  = (int) $payload['sub'];

        $campos   = [];
        $valores  = [];

        $permitidos = [
            'nombre', 'alias', 'bio', 'ciudad',
            'provincia', 'telefono', 'fecha_nac', 'color_avatar',
        ];

        foreach ($permitidos as $campo) {
            if (array_key_exists($campo, $data)) {
                $campos[]  = "$campo = ?";
                $valores[] = $data[$campo];
            }
        }

        if (empty($campos)) {
            error('No hay campos para actualizar');
        }

        // Actualizar el avatar con la primera letra del nuevo nombre
        if (array_key_exists('nombre', $data)) {
            $campos[]  = 'avatar = ?';
            $valores[] = strtoupper(mb_substr(trim($data['nombre']), 0, 1));
        }

        $valores[] = $userId;
        $db = getDB();
        $db->prepare(
            'UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = ?'
        )->execute($valores);

        // Devolver usuario actualizado (sin hash)
        $stmt = $db->prepare(
            'SELECT id, nombre, alias, email, avatar, puntos,
                    bio, ciudad, provincia, telefono, fecha_nac,
                    color_avatar, fecha_registro
             FROM usuarios WHERE id = ?'
        );
        $stmt->execute([$userId]);
        ok(['usuario' => $stmt->fetch()], 'Perfil actualizado');
    }

    // ── POST /usuarios/me/puntos ──────────────────────────────────────────────
    // Body: { "cantidad": N }  (puede ser negativo)
    public function sumarPuntos(): never
    {
        $payload  = autenticar();
        $data     = bodyJson();
        $userId   = (int) $payload['sub'];
        $cantidad = (int) ($data['cantidad'] ?? 0);

        if ($cantidad === 0) error('La cantidad no puede ser 0');

        $db = getDB();
        // puntos nunca baja de 0
        $db->prepare(
            'UPDATE usuarios
             SET puntos = GREATEST(0, puntos + ?)
             WHERE id = ?'
        )->execute([$cantidad, $userId]);

        $stmt = $db->prepare('SELECT puntos FROM usuarios WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        ok(['puntos' => (int) $row['puntos']], 'Puntos actualizados');
    }
}
