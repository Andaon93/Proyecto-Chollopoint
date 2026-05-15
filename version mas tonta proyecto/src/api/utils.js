// convierte los datos que devuelve el backend (snake_case) al formato que usamos en react

export const normalizeChollo = (c) => ({
  id: c.id,
  titulo: c.titulo,
  descripcion: c.descripcion || "",
  precioOriginal: parseFloat(c.precio_original),
  precioOferta: parseFloat(c.precio_oferta),
  descuento: c.descuento || "",
  tienda: c.tienda || "",
  enlace: c.enlace || "",
  imagen: c.imagen || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
  categoria: c.categoria || "",
  ciudad: c.ciudad || "",
  comunidad: c.comunidad || "",
  publicadoPor: c.publicado_por || "",
  usuarioId: c.usuario_id,
  votosPositivos: parseInt(c.votos_positivos) || 0,
  votosNegativos: parseInt(c.votos_negativos) || 0,
  votos: parseInt(c.votos_positivos) || 0,
  creadoEn: c.creado_en ? new Date(c.creado_en).getTime() : null,
  expiraEn: c.expira_en ? new Date(c.expira_en).getTime() : null,
  activo: c.activo,
  miVoto: c.mi_voto || null,
  autorNombre: c.autor_nombre || c.publicado_por || "",
  autorAvatar: c.autor_avatar || "",
  autorPuntos: parseInt(c.autor_puntos) || 0,
});

export const normalizeComentario = (c) => ({
  id: c.id,
  usuario: c.usuario,
  avatar: c.avatar || (c.usuario ? c.usuario.charAt(0).toUpperCase() : "?"),
  puntos: parseInt(c.puntos) || 0,
  fecha: c.creado_en
    ? new Date(c.creado_en).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
  comentario: c.texto,
  votos: parseInt(c.votos) || 0,
  votosPositivos: parseInt(c.votos_positivos) || 0,
  votosNegativos: parseInt(c.votos_negativos) || 0,
  miVoto: c.mi_voto || null,
  usuarioId: c.usuario_id,
});