<?php
// ============================================================
//  controllers/FavoritosController.php
//
//  GET    /favoritos          — Mis favoritos (auth)
//  POST   /favoritos/{id}     — Añadir/quitar favorito (toggle) (auth)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class FavoritosController
{
    // ── GET /favoritos ────────────────────────────────────────────────────────
    public function listar(): never
    {
        $payload = autenticar();
        $db      = getDB();

        $stmt = $db->prepare(
            'SELECT c.*
             FROM favoritos f
             JOIN chollos c ON c.id = f.chollo_id
             WHERE f.usuario_id = ?
             ORDER BY f.creado_en DESC'
        );
        $stmt->execute([$payload['sub']]);
        ok(['favoritos' => $stmt->fetchAll()]);
    }

    // ── POST /favoritos/{cholloId} (toggle) ───────────────────────────────────
    public function toggle(int $cholloId): never
    {
        $payload = autenticar();
        $userId  = (int) $payload['sub'];
        $db      = getDB();

        // Verificar que el chollo existe
        $s = $db->prepare('SELECT id FROM chollos WHERE id = ?');
        $s->execute([$cholloId]);
        if (!$s->fetch()) error('Chollo no encontrado', 404);

        // Toggle
        $sv = $db->prepare(
            'SELECT id FROM favoritos WHERE usuario_id = ? AND chollo_id = ?'
        );
        $sv->execute([$userId, $cholloId]);
        $existe = $sv->fetch();

        if ($existe) {
            $db->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND chollo_id = ?')
               ->execute([$userId, $cholloId]);
            ok(['favorito' => false], 'Eliminado de favoritos');
        } else {
            $db->prepare('INSERT INTO favoritos (usuario_id, chollo_id) VALUES (?,?)')
               ->execute([$userId, $cholloId]);
            ok(['favorito' => true], 'Añadido a favoritos');
        }
    }
}
