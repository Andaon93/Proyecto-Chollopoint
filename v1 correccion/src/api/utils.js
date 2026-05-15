export function normalizeChollo(c) {
  let imagen = c.imagen;
  if (!imagen) imagen = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600';

  let latitud = null;
  let longitud = null;
  if (c.latitud != null) latitud = parseFloat(c.latitud);
  if (c.longitud != null) longitud = parseFloat(c.longitud);

  return {
    id:              c.id,
    titulo:          c.titulo,
    descripcion:     c.descripcion    || '',
    precioOriginal:  parseFloat(c.precio_original),
    precioOferta:    parseFloat(c.precio_oferta),
    descuento:       c.descuento      || '',
    tienda:          c.tienda         || '',
    enlace:          c.enlace         || '',
    imagen:          imagen,
    categoria:       c.categoria      || '',
    ciudad:          c.ciudad         || '',
    comunidad:       c.comunidad      || '',
    publicadoPor:    c.publicado_por  || '',
    usuarioId:       c.usuario_id,
    votosPositivos:  parseInt(c.votos_positivos) || 0,
    votosNegativos:  parseInt(c.votos_negativos) || 0,
    votos:           parseInt(c.votos_positivos) || 0,
    creadoEn:        c.creado_en ? new Date(c.creado_en).getTime() : null,
    expiraEn:        c.expira_en ? new Date(c.expira_en).getTime() : null,
    activo:          c.activo,
    miVoto:          c.mi_voto        || null,
    autorNombre:     c.autor_nombre   || c.publicado_por || '',
    autorAvatar:     c.autor_avatar   || '',
    autorPuntos:     parseInt(c.autor_puntos) || 0,
    latitud:         latitud,
    longitud:        longitud,
    direccionExacta: c.direccion_exacta || null,
  };
}

export function normalizeComentario(c) {
  let avatar = '?';
  if (c.avatar) avatar = c.avatar;
  else if (c.usuario) avatar = c.usuario.charAt(0).toUpperCase();

  let fecha = '';
  if (c.creado_en) {
    fecha = new Date(c.creado_en).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return {
    id:             c.id,
    usuario:        c.usuario,
    avatar:         avatar,
    puntos:         parseInt(c.puntos) || 0,
    fecha:          fecha,
    comentario:     c.texto,
    votos:          parseInt(c.votos)           || 0,
    votosPositivos: parseInt(c.votos_positivos) || 0,
    votosNegativos: parseInt(c.votos_negativos) || 0,
    miVoto:         c.mi_voto  || null,
    usuarioId:      c.usuario_id,
  };
}