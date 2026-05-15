<?php
// ============================================================
//  controllers/ComentariosController.php
//
//  GET    /chollos/{id}/comentarios    — Listar comentarios
//  POST   /chollos/{id}/comentarios    — Añadir comentario (auth)
//  DELETE /comentarios/{id}            — Eliminar comentario (autor)
//  POST   /comentarios/{id}/votar      — Votar un comentario (auth)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class ComentariosController
{
    // ── GET /chollos/{cholloId}/comentarios ───────────────────────────────────
    public function listar(int $cholloId): never
    {
        $usuario = autenticarOpcional();
        $userId  = $usuario ? (int) $usuario['sub'] : null;
        $db      = getDB();

        $stmt = $db->prepare(
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
        $stmt->execute([$cholloId]);
        $comentarios = $stmt->fetchAll();

        // Añadir mi_voto a cada comentario si hay usuario autenticado
        if ($userId && count($comentarios) > 0) {
            $ids = array_column($comentarios, 'id');
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $sv = $db->prepare(
                "SELECT comentario_id, tipo FROM votos_comentarios
                 WHERE usuario_id = ? AND comentario_id IN ($placeholders)"
            );
            $sv->execute(array_merge([$userId], $ids));
            $misVotos = [];
            foreach ($sv->fetchAll() as $v) {
                $misVotos[$v['comentario_id']] = $v['tipo'];
            }
            foreach ($comentarios as &$c) {
                $c['mi_voto'] = $misVotos[$c['id']] ?? null;
            }
            unset($c);
        } else {
            foreach ($comentarios as &$c) {
                $c['mi_voto'] = null;
            }
            unset($c);
        }

        ok(['comentarios' => $comentarios]);
    }

    // ── POST /chollos/{cholloId}/comentarios ──────────────────────────────────
    public function crear(int $cholloId): never
    {
        $payload = autenticar();
        $data    = bodyJson();
        $userId  = (int) $payload['sub'];

        requeridos($data, ['texto']);
        $texto = trim($data['texto']);
        if (strlen($texto) < 1) error('El comentario no puede estar vacío');

        $db = getDB();

        // Verificar que el chollo existe
        $stmt = $db->prepare('SELECT id FROM chollos WHERE id = ?');
        $stmt->execute([$cholloId]);
        if (!$stmt->fetch()) error('Chollo no encontrado', 404);

        // Insertar comentario
        $db->prepare(
            'INSERT INTO comentarios (chollo_id, usuario_id, texto) VALUES (?,?,?)'
        )->execute([$cholloId, $userId, $texto]);
        $comId = (int) $db->lastInsertId();

        // +2 puntos al comentar
        $db->prepare(
            'UPDATE usuarios SET puntos = puntos + 2 WHERE id = ?'
        )->execute([$userId]);

        // Devolver el comentario completo
        $stmt = $db->prepare(
            'SELECT c.id, c.texto, c.votos_positivos, c.votos_negativos, c.creado_en,
                    u.id     AS usuario_id,
                    u.nombre AS usuario,
                    u.avatar,
                    u.puntos
             FROM comentarios c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.id = ?'
        );
        $stmt->execute([$comId]);
        $comentario = $stmt->fetch();
        $comentario['mi_voto'] = null;

        ok(['comentario' => $comentario], 'Comentario publicado (+2 puntos)');
    }

    // ── DELETE /comentarios/{id} ──────────────────────────────────────────────
    public function eliminar(int $id): never
    {
        $payload = autenticar();
        $db      = getDB();

        $stmt = $db->prepare('SELECT usuario_id FROM comentarios WHERE id = ?');
        $stmt->execute([$id]);
        $com = $stmt->fetch();

        if (!$com) error('Comentario no encontrado', 404);
        if ((int) $com['usuario_id'] !== (int) $payload['sub']) {
            error('No tienes permiso para eliminar este comentario', 403);
        }

        $db->prepare('DELETE FROM comentarios WHERE id = ?')->execute([$id]);
        ok(null, 'Comentario eliminado');
    }

    // ── POST /comentarios/{id}/votar ──────────────────────────────────────────
    // Body: { "tipo": "positivo"|"negativo" }
    public function votar(int $id): never
    {
        $payload = autenticar();
        $userId  = (int) $payload['sub'];
        $data    = bodyJson();
        $tipo    = $data['tipo'] ?? '';
        $db      = getDB();

        if (!in_array($tipo, ['positivo', 'negativo'], true)) {
            error('El tipo debe ser "positivo" o "negativo"');
        }

        $stmt = $db->prepare('SELECT id, usuario_id FROM comentarios WHERE id = ?');
        $stmt->execute([$id]);
        $comentario = $stmt->fetch();
        if (!$comentario) error('Comentario no encontrado', 404);

        // Verificar voto previo
        $sv = $db->prepare(
            'SELECT id, tipo FROM votos_comentarios WHERE comentario_id = ? AND usuario_id = ?'
        );
        $sv->execute([$id, $userId]);
        $votoExistente = $sv->fetch();

        if ($votoExistente) {
            if ($votoExistente['tipo'] === $tipo) {
                error('Ya has votado este comentario con ese tipo', 409);
            }
            // Cambiar voto: restar el antiguo, sumar el nuevo
            $campoResta = $votoExistente['tipo'] === 'positivo' ? 'votos_positivos' : 'votos_negativos';
            $campoSuma  = $tipo === 'positivo' ? 'votos_positivos' : 'votos_negativos';
            $db->prepare(
                "UPDATE comentarios SET $campoResta = GREATEST(0, $campoResta - 1), $campoSuma = $campoSuma + 1 WHERE id = ?"
            )->execute([$id]);
            $db->prepare(
                'UPDATE votos_comentarios SET tipo = ? WHERE id = ?'
            )->execute([$tipo, $votoExistente['id']]);
        } else {
            // Nuevo voto
            $campo = $tipo === 'positivo' ? 'votos_positivos' : 'votos_negativos';
            $db->prepare(
                "UPDATE comentarios SET $campo = $campo + 1 WHERE id = ?"
            )->execute([$id]);
            $db->prepare(
                'INSERT INTO votos_comentarios (comentario_id, usuario_id, tipo) VALUES (?,?,?)'
            )->execute([$id, $userId, $tipo]);

            // +1 punto al autor si el voto es positivo
            if ($tipo === 'positivo') {
                $db->prepare(
                    'UPDATE usuarios SET puntos = puntos + 1 WHERE id = ?'
                )->execute([$comentario['usuario_id']]);
            }
        }

        // Devolver conteos actualizados
        $stmt = $db->prepare(
            'SELECT votos_positivos, votos_negativos FROM comentarios WHERE id = ?'
        );
        $stmt->execute([$id]);
        $totales = $stmt->fetch();

        ok([
            'positivos' => (int) $totales['votos_positivos'],
            'negativos' => (int) $totales['votos_negativos'],
            'mi_voto'   => $tipo,
        ], 'Voto registrado');
    }
}
