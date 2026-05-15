// ============================================================
//  src/api/utils.js
//  Normaliza las respuestas del backend (snake_case)
//  al formato que usan los componentes React.
// ============================================================

/**
 * Transforma los datos de un chollo recibidos del backend
 * al formato que usan los componentes
 * @param {Object} c - Objeto chollo tal como viene del servidor
 * @returns {Object} Chollo normalizado
 */
export function normalizeChollo(c) {
  return {
    id:             c.id,
    titulo:         c.titulo,
    descripcion:    c.descripcion || '',
    precioOriginal: parseFloat(c.precio_original),
    precioOferta:   parseFloat(c.precio_oferta),
    descuento:      c.descuento || '',
    tienda:         c.tienda || '',
    enlace:         c.enlace || '',
    // Imagen por defecto si no tiene
    imagen:         c.imagen || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
    categoria:      c.categoria || '',
    ciudad:         c.ciudad || '',
    comunidad:      c.comunidad || '',
    publicadoPor:   c.publicado_por || '',
    usuarioId:      c.usuario_id,
    votosPositivos: parseInt(c.votos_positivos) || 0,
    votosNegativos: parseInt(c.votos_negativos) || 0,
    votos:          parseInt(c.votos_positivos) || 0,
    // Convertir fechas a timestamp para facilitar comparaciones
    creadoEn:       c.creado_en ? new Date(c.creado_en).getTime() : null,
    expiraEn:       c.expira_en ? new Date(c.expira_en).getTime() : null,
    activo:         c.activo,
    miVoto:         c.mi_voto || null,
    // Campos del JOIN con la tabla de usuarios
    autorNombre:    c.autor_nombre || c.publicado_por || '',
    autorAvatar:    c.autor_avatar || '',
    autorPuntos:    parseInt(c.autor_puntos) || 0,
  };
}

/**
 * Transforma los datos de un comentario recibidos del backend
 * al formato que usan los componentes
 * @param {Object} c - Objeto comentario tal como viene del servidor
 * @returns {Object} Comentario normalizado
 */
export function normalizeComentario(c) {
  // Si no tiene avatar usamos la primera letra del usuario
  const avatarPorDefecto = c.usuario ? c.usuario.charAt(0).toUpperCase() : '?';

  return {
    id:             c.id,
    usuario:        c.usuario,
    avatar:         c.avatar || avatarPorDefecto,
    puntos:         parseInt(c.puntos) || 0,
    // Formatear la fecha en formato español
    fecha:          c.creado_en
      ? new Date(c.creado_en).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    comentario:     c.texto,
    votos:          parseInt(c.votos) || 0,
    votosPositivos: parseInt(c.votos_positivos) || 0,
    votosNegativos: parseInt(c.votos_negativos) || 0,
    miVoto:         c.mi_voto || null,
    usuarioId:      c.usuario_id,
  };
}