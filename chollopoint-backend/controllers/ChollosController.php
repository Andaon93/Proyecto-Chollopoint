<?php
// ============================================================
//  controllers/ChollosController.php
//
//  GET    /chollos            — Listar (con filtros + paginación)
//  GET    /chollos/{id}       — Detalle de un chollo
//  POST   /chollos            — Crear chollo (auth)
//  PUT    /chollos/{id}       — Editar chollo (solo autor)
//  DELETE /chollos/{id}       — Eliminar chollo (solo autor)
//  POST   /chollos/{id}/votar — Votar positivo/negativo (auth)
// ============================================================

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class ChollosController
{
    // ── GET /chollos ──────────────────────────────────────────────────────────
    // Query params opcionales:
    //   categoria, ciudad, precio_min, precio_max,
    //   orden (recent|priceLow|priceHigh|discount),
    //   pagina (1-based), por_pagina (default 20),
    //   solo_activos (1|0, default 1),
    //   con_coords (1|0) — si 1, devuelve solo chollos con latitud/longitud
    public function listar(): never
    {
        $db = getDB();

        $where  = [];
        $params = [];

        // Filtro activos / expirados
        $soloActivos = ($_GET['solo_activos'] ?? '1') === '1';
        if ($soloActivos) {
            $where[] = 'c.activo = 1 AND c.expira_en > NOW()';
        }

        // Filtro: solo chollos con coordenadas (útil para el mapa)
        $conCoords = ($_GET['con_coords'] ?? '0') === '1';
        if ($conCoords) {
            $where[] = 'c.latitud IS NOT NULL AND c.longitud IS NOT NULL';
        }

        if (!empty($_GET['categoria'])) {
            $where[]  = 'c.categoria = ?';
            $params[] = $_GET['categoria'];
        }

        if (!empty($_GET['ciudad'])) {
            $where[]  = 'c.ciudad = ?';
            $params[] = $_GET['ciudad'];
        }

        if (isset($_GET['precio_min']) && $_GET['precio_min'] !== '') {
            $where[]  = 'c.precio_oferta >= ?';
            $params[] = (float) $_GET['precio_min'];
        }

        if (isset($_GET['precio_max']) && $_GET['precio_max'] !== '') {
            $where[]  = 'c.precio_oferta <= ?';
            $params[] = (float) $_GET['precio_max'];
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Ordenación
        $ordenMap = [
            'recent'    => 'c.creado_en DESC',
            'priceLow'  => 'c.precio_oferta ASC',
            'priceHigh' => 'c.precio_oferta DESC',
            'discount'  => 'c.votos_positivos DESC',
        ];
        $orden = $ordenMap[$_GET['orden'] ?? 'recent'] ?? $ordenMap['recent'];

        // Paginación
        $porPagina = max(1, min(200, (int) ($_GET['por_pagina'] ?? 20)));
        $pagina    = max(1, (int) ($_GET['pagina'] ?? 1));
        $offset    = ($pagina - 1) * $porPagina;

        // Total de resultados
        $stmtTotal = $db->prepare(
            "SELECT COUNT(*) FROM chollos c $whereSql"
        );
        $stmtTotal->execute($params);
        $total = (int) $stmtTotal->fetchColumn();

        // Resultados — incluimos latitud, longitud y direccion_exacta
        $stmt = $db->prepare(
            "SELECT c.*,
                    u.nombre AS autor_nombre,
                    u.avatar AS autor_avatar,
                    u.puntos AS autor_puntos
             FROM chollos c
             JOIN usuarios u ON u.id = c.usuario_id
             $whereSql
             ORDER BY $orden
             LIMIT $porPagina OFFSET $offset"
        );
        $stmt->execute($params);
        $chollos = $stmt->fetchAll();

        ok([
            'chollos'    => $chollos,
            'total'      => $total,
            'pagina'     => $pagina,
            'por_pagina' => $porPagina,
            'paginas'    => (int) ceil($total / $porPagina),
        ]);
    }

    // ── GET /chollos/{id} ─────────────────────────────────────────────────────
    public function ver(int $id): never
    {
        $usuario = autenticarOpcional();
        $db      = getDB();

        $stmt = $db->prepare(
            'SELECT c.*,
                    u.nombre AS autor_nombre,
                    u.avatar AS autor_avatar,
                    u.puntos AS autor_puntos
             FROM chollos c
             JOIN usuarios u ON u.id = c.usuario_id
             WHERE c.id = ?'
        );
        $stmt->execute([$id]);
        $chollo = $stmt->fetch();

        if (!$chollo) error('Chollo no encontrado', 404);

        // ¿El usuario ya votó este chollo?
        $miVoto = null;
        if ($usuario) {
            $sv = $db->prepare(
                'SELECT tipo FROM votos_chollos WHERE chollo_id = ? AND usuario_id = ?'
            );
            $sv->execute([$id, $usuario['sub']]);
            $vr = $sv->fetch();
            $miVoto = $vr ? $vr['tipo'] : null;
        }

        $chollo['mi_voto'] = $miVoto;
        ok(['chollo' => $chollo]);
    }

    // ── POST /chollos ─────────────────────────────────────────────────────────
    public function crear(): never
    {
        $payload = autenticar();
        $data    = bodyJson();

        requeridos($data, ['titulo', 'precio_original', 'precio_oferta', 'tienda', 'categoria', 'ciudad']);

        $precioOrig  = (float) $data['precio_original'];
        $precioOfert = (float) $data['precio_oferta'];

        if ($precioOfert >= $precioOrig) {
            error('El precio oferta debe ser menor al precio original');
        }

        $descuento = '-' . round((($precioOrig - $precioOfert) / $precioOrig) * 100) . '%';

        // ── Coordenadas (opcionales) ─────────────────────────────────────────
        // Llegan como null si el usuario no introdujo dirección.
        // Se valida que, si llegan, sean números dentro del rango de España.
        $latitud         = isset($data['latitud'])  && is_numeric($data['latitud'])
                            ? (float) $data['latitud']  : null;
        $longitud        = isset($data['longitud']) && is_numeric($data['longitud'])
                            ? (float) $data['longitud'] : null;
        $direccionExacta = isset($data['direccion_exacta'])
                            ? trim($data['direccion_exacta']) : null;

        // Rango aproximado de España peninsular + islas
        if ($latitud !== null && ($latitud < 27.0 || $latitud > 44.5)) {
            $latitud = null; // coordenada fuera de rango, ignorar
        }
        if ($longitud !== null && ($longitud < -18.5 || $longitud > 5.0)) {
            $longitud = null;
        }
        // Si una coord es inválida, descartamos ambas para no tener datos inconsistentes
        if ($latitud === null || $longitud === null) {
            $latitud = $longitud = $direccionExacta = null;
        }

        $db   = getDB();
        $stmt = $db->prepare(
            'INSERT INTO chollos
             (titulo, descripcion, precio_original, precio_oferta, descuento,
              tienda, enlace, imagen, categoria, ciudad, comunidad,
              usuario_id, publicado_por,
              latitud, longitud, direccion_exacta,
              expira_en)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR))'
        );

        $stmt->execute([
            trim($data['titulo']),
            trim($data['descripcion'] ?? ''),
            $precioOrig,
            $precioOfert,
            $descuento,
            trim($data['tienda']),
            trim($data['enlace'] ?? ''),
            trim($data['imagen'] ?? ''),
            $data['categoria'],
            $data['ciudad'],
            $data['comunidad'] ?? $data['ciudad'],
            $payload['sub'],
            $data['publicado_por'] ?? 'Anónimo',
            $latitud,
            $longitud,
            $direccionExacta,
        ]);

        $nuevoId = (int) $db->lastInsertId();

        // +10 puntos al publicar
        $db->prepare(
            'UPDATE usuarios SET puntos = puntos + 10 WHERE id = ?'
        )->execute([$payload['sub']]);

        $stmt = $db->prepare('SELECT * FROM chollos WHERE id = ?');
        $stmt->execute([$nuevoId]);

        ok(['chollo' => $stmt->fetch()], 'Chollo publicado (+10 puntos)');
    }

    // ── PUT /chollos/{id} ─────────────────────────────────────────────────────
    public function editar(int $id): never
    {
        $payload = autenticar();
        $data    = bodyJson();
        $db      = getDB();

        // Verificar autoría
        $stmt = $db->prepare('SELECT usuario_id FROM chollos WHERE id = ?');
        $stmt->execute([$id]);
        $chollo = $stmt->fetch();
        if (!$chollo) error('Chollo no encontrado', 404);
        if ((int) $chollo['usuario_id'] !== (int) $payload['sub']) {
            error('No tienes permiso para editar este chollo', 403);
        }

        $campos  = [];
        $valores = [];

        $editables = [
            'titulo', 'descripcion', 'precio_original', 'precio_oferta',
            'tienda', 'enlace', 'imagen', 'categoria', 'ciudad', 'comunidad',
        ];
        foreach ($editables as $c) {
            if (array_key_exists($c, $data)) {
                $campos[]  = "$c = ?";
                $valores[] = $data[$c];
            }
        }

        if (isset($data['precio_original'], $data['precio_oferta'])) {
            $pOrig  = (float) $data['precio_original'];
            $pOfert = (float) $data['precio_oferta'];
            if ($pOfert >= $pOrig) error('El precio oferta debe ser menor al original');
            $desc      = '-' . round((($pOrig - $pOfert) / $pOrig) * 100) . '%';
            $campos[]  = 'descuento = ?';
            $valores[] = $desc;
        }

        // ── Actualizar coordenadas si vienen en el body ──────────────────────
        if (array_key_exists('latitud', $data)) {
            $lat = is_numeric($data['latitud']) ? (float) $data['latitud'] : null;
            $lng = array_key_exists('longitud', $data) && is_numeric($data['longitud'])
                    ? (float) $data['longitud'] : null;

            if ($lat !== null && ($lat < 27.0 || $lat > 44.5)) $lat = null;
            if ($lng !== null && ($lng < -18.5 || $lng > 5.0))  $lng = null;
            if ($lat === null || $lng === null) {
                $lat = $lng = null;
            }

            $campos[]  = 'latitud = ?';
            $valores[] = $lat;
            $campos[]  = 'longitud = ?';
            $valores[] = $lng;
            $campos[]  = 'direccion_exacta = ?';
            $valores[] = ($lat !== null && isset($data['direccion_exacta']))
                            ? trim($data['direccion_exacta']) : null;
        }

        if (empty($campos)) error('No hay campos para actualizar');

        $valores[] = $id;
        $db->prepare(
            'UPDATE chollos SET ' . implode(', ', $campos) . ' WHERE id = ?'
        )->execute($valores);

        $stmt = $db->prepare('SELECT * FROM chollos WHERE id = ?');
        $stmt->execute([$id]);
        ok(['chollo' => $stmt->fetch()], 'Chollo actualizado');
    }

    // ── DELETE /chollos/{id} ──────────────────────────────────────────────────
    public function eliminar(int $id): never
    {
        $payload = autenticar();
        $db      = getDB();

        $stmt = $db->prepare('SELECT usuario_id FROM chollos WHERE id = ?');
        $stmt->execute([$id]);
        $chollo = $stmt->fetch();

        if (!$chollo) error('Chollo no encontrado', 404);
        if ((int) $chollo['usuario_id'] !== (int) $payload['sub']) {
            error('No tienes permiso para eliminar este chollo', 403);
        }

        $db->prepare('DELETE FROM chollos WHERE id = ?')->execute([$id]);
        ok(null, 'Chollo eliminado');
    }

    // ── POST /chollos/{id}/votar ──────────────────────────────────────────────
    // Body: { "tipo": "positivo"|"negativo" }
    public function votar(int $id): never
    {
        $payload = autenticar();
        $data    = bodyJson();
        $tipo    = $data['tipo'] ?? '';
        $userId  = (int) $payload['sub'];

        if (!in_array($tipo, ['positivo', 'negativo'], true)) {
            error('El tipo debe ser "positivo" o "negativo"');
        }

        $db = getDB();

        // Comprobar que el chollo existe
        $stmt = $db->prepare('SELECT id, usuario_id FROM chollos WHERE id = ?');
        $stmt->execute([$id]);
        $chollo = $stmt->fetch();
        if (!$chollo) error('Chollo no encontrado', 404);

        // Voto ya existente
        $sv = $db->prepare(
            'SELECT id, tipo FROM votos_chollos WHERE chollo_id = ? AND usuario_id = ?'
        );
        $sv->execute([$id, $userId]);
        $votoExistente = $sv->fetch();

        if ($votoExistente) {
            if ($votoExistente['tipo'] === $tipo) {
                error('Ya has votado este chollo con ese tipo', 409);
            }

            // Cambiar voto
            $campoResta = $votoExistente['tipo'] === 'positivo' ? 'votos_positivos' : 'votos_negativos';
            $campoSuma  = $tipo === 'positivo' ? 'votos_positivos' : 'votos_negativos';

            $db->prepare(
                "UPDATE chollos
                 SET $campoResta = GREATEST(0, $campoResta - 1), $campoSuma = $campoSuma + 1
                 WHERE id = ?"
            )->execute([$id]);
            $db->prepare(
                'UPDATE votos_chollos SET tipo = ? WHERE id = ?'
            )->execute([$tipo, $votoExistente['id']]);
        } else {
            // Nuevo voto
            $campo = $tipo === 'positivo' ? 'votos_positivos' : 'votos_negativos';
            $db->prepare(
                "UPDATE chollos SET $campo = $campo + 1 WHERE id = ?"
            )->execute([$id]);
            $db->prepare(
                'INSERT INTO votos_chollos (chollo_id, usuario_id, tipo) VALUES (?,?,?)'
            )->execute([$id, $userId, $tipo]);

            // +1 punto al autor si el voto es positivo
            if ($tipo === 'positivo') {
                $db->prepare(
                    'UPDATE usuarios SET puntos = puntos + 1 WHERE id = ?'
                )->execute([$chollo['usuario_id']]);
            }
        }

        // Devolver recuento actualizado
        $stmt = $db->prepare(
            'SELECT votos_positivos, votos_negativos FROM chollos WHERE id = ?'
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