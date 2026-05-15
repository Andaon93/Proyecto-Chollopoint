// 📄 DetalleChollo.jsx
// Muestra toda la información de un chollo: imagen, precios,
// comentarios, votos, favoritos y opciones del autor.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Button,
  Chip, Avatar, TextField, IconButton, LinearProgress, Divider, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Snackbar, Alert,
} from "@mui/material";

import CloseIcon        from "@mui/icons-material/Close";
import ThumbUpIcon      from "@mui/icons-material/ThumbUp";
import ThumbDownIcon    from "@mui/icons-material/ThumbDown";
import FavoriteIcon     from "@mui/icons-material/Favorite";
import ShareIcon        from "@mui/icons-material/Share";
import SendIcon         from "@mui/icons-material/Send";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon   from "@mui/icons-material/LocalOffer";
import StoreIcon        from "@mui/icons-material/Store";
import LocationOnIcon   from "@mui/icons-material/LocationOn";
import EditIcon         from "@mui/icons-material/Edit";
import DeleteIcon       from "@mui/icons-material/Delete";

import { useAuth }                               from "../context/AuthContext";
import api                                       from "../api/client";
import { normalizeChollo, normalizeComentario }  from "../api/utils";

// ─── Sistema de niveles por puntos ────────────────────────────────────────────
const NIVELES = [
  { nombre: "Novato",      min: 0,    max: 99,       color: "#78909c", icon: "🌱" },
  { nombre: "Cazachollos", min: 100,  max: 299,      color: "#42a5f5", icon: "🔍" },
  { nombre: "Experto",     min: 300,  max: 599,      color: "#ab47bc", icon: "⚡" },
  { nombre: "Leyenda",     min: 600,  max: 999,      color: "#ffa726", icon: "🔥" },
  { nombre: "Élite",       min: 1000, max: Infinity, color: "#e53935", icon: "👑" },
];

/**
 * Devuelve el nivel correspondiente a los puntos del usuario
 * @param {number} puntos - Puntos del usuario
 * @returns {Object} Objeto con nombre, colores e icono del nivel
 */
function getNivel(puntos) {
  return NIVELES.find(n => puntos >= n.min && puntos <= n.max) || NIVELES[0];
}

/**
 * Muestra una etiqueta con el nivel de reputación del usuario
 * @param {Object} props
 * @param {number} props.puntos - Puntos del usuario
 */
function BadgeReputacion({ puntos }) {
  const nivel = getNivel(puntos);

  return (
    <Tooltip title={`${puntos} puntos`} arrow placement="top">
      <Chip
        label={`${nivel.icon} ${nivel.nombre}`}
        size="small"
        sx={{
          bgcolor: nivel.color + "22",
          color: nivel.color,
          fontWeight: "bold",
          fontSize: 11,
          height: 20,
          cursor: "default",
        }}
      />
    </Tooltip>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function DetalleChollo() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  // Estado del chollo y comentarios
  const [chollo,          setChollo]          = useState(null);
  const [comentarios,     setComentarios]     = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [favorito,        setFavorito]        = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoCom,     setEnviandoCom]     = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [mensajeError,    setMensajeError]    = useState(null);

  // Votos del chollo principal
  const [datosVoto, setDatosVoto] = useState({
    positivos: 0,
    negativos: 0,
    miVoto: null,
  });

  // Votos de cada comentario: { [idComentario]: { positivos, negativos, miVoto } }
  const [votosComentarios, setVotosComentarios] = useState({});

  /**
   * Carga el chollo, sus comentarios y comprueba si es favorito
   */
  useEffect(() => {
    async function fetchDatos() {
      setCargando(true);
      try {
        // Cargar el chollo y sus comentarios al mismo tiempo
        const [resChollo, resCom] = await Promise.all([
          api.chollos.ver(id),
          api.comentarios.listar(id),
        ]);

        // Normalizar y guardar el chollo
        const cholloNormalizado = normalizeChollo(resChollo.data.chollo);
        setChollo(cholloNormalizado);
        setDatosVoto({
          positivos: cholloNormalizado.votosPositivos,
          negativos: cholloNormalizado.votosNegativos,
          miVoto:    cholloNormalizado.miVoto,
        });

        // Normalizar y guardar los comentarios
        const comsNormalizados = (resCom.data.comentarios || []).map(normalizeComentario);
        setComentarios(comsNormalizados);

        // Inicializar los votos de cada comentario
        const votosIniciales = {};
        comsNormalizados.forEach(com => {
          votosIniciales[com.id] = {
            positivos: com.votosPositivos ?? 0,
            negativos: com.votosNegativos ?? 0,
            miVoto:    com.miVoto ?? null,
          };
        });
        setVotosComentarios(votosIniciales);

      } catch (error) {
        console.error("Error al cargar el chollo:", error);
      }
      setCargando(false);
    }

    fetchDatos();
  }, [id]);

  /**
   * Comprueba si el chollo está en favoritos del usuario
   */
  useEffect(() => {
    async function fetchFavoritos() {
      try {
        const respuesta = await api.favoritos.listar();
        const idsFavoritos = (respuesta.data.favoritos || []).map(f => f.id);
        setFavorito(idsFavoritos.includes(Number(id)));
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      }
    }

    // Solo comprobamos favoritos si hay sesión iniciada
    if (usuario) fetchFavoritos();
  }, [id, usuario]);

  /**
   * Envía un nuevo comentario al backend
   */
  async function enviarComentario() {
    if (!nuevoComentario.trim() || !usuario || enviandoCom) return;

    setEnviandoCom(true);
    try {
      const respuesta = await api.comentarios.crear(id, nuevoComentario.trim());
      const comentarioNuevo = normalizeComentario(respuesta.data.comentario);

      // Añadir el comentario al inicio de la lista
      setComentarios(prev => [comentarioNuevo, ...prev]);

      // Inicializar sus votos a 0
      setVotosComentarios(prev => ({
        ...prev,
        [comentarioNuevo.id]: { positivos: 0, negativos: 0, miVoto: null },
      }));

      setNuevoComentario("");
    } catch (error) {
      console.error("Error al enviar comentario:", error);
    }
    setEnviandoCom(false);
  }

  /**
   * Registra el voto del usuario en el chollo
   * @param {string} tipo - "positivo" o "negativo"
   */
  async function votar(tipo) {
    // No permitir votar si no hay sesión o ya votó lo mismo
    if (!usuario || datosVoto.miVoto === tipo) return;

    try {
      const respuesta = await api.chollos.votar(id, tipo);
      setDatosVoto({
        positivos: respuesta.data.positivos,
        negativos: respuesta.data.negativos,
        miVoto:    respuesta.data.mi_voto,
      });
    } catch (error) {
      console.error("Error al votar el chollo:", error);
    }
  }

  /**
   * Registra el voto del usuario en un comentario concreto.
   * Usa actualización optimista: el UI cambia al instante y revierte si falla.
   * @param {number} idComentario - ID del comentario
   * @param {string} tipo - "positivo" o "negativo"
   */
  async function votarComentario(idComentario, tipo) {
    if (!usuario) return;

    const estadoActual = votosComentarios[idComentario] || {
      positivos: 0,
      negativos: 0,
      miVoto: null,
    };

    // Si ya votó lo mismo no hacemos nada
    if (estadoActual.miVoto === tipo) return;

    // Actualización optimista: mostramos el cambio antes de que responda el servidor
    const votoAnterior = estadoActual.miVoto;
    const estadoOptimista = {
      positivos: estadoActual.positivos
        + (tipo === "positivo" ? 1 : 0)
        - (votoAnterior === "positivo" ? 1 : 0),
      negativos: estadoActual.negativos
        + (tipo === "negativo" ? 1 : 0)
        - (votoAnterior === "negativo" ? 1 : 0),
      miVoto: tipo,
    };
    setVotosComentarios(prev => ({ ...prev, [idComentario]: estadoOptimista }));

    try {
      const respuesta = await api.comentarios.votar(idComentario, tipo);
      const datos = respuesta.data;

      // Si el servidor devuelve los datos reales los usamos
      if (datos.positivos !== undefined || datos.negativos !== undefined) {
        setVotosComentarios(prev => ({
          ...prev,
          [idComentario]: {
            positivos: datos.positivos ?? estadoOptimista.positivos,
            negativos: datos.negativos ?? estadoOptimista.negativos,
            miVoto:    datos.mi_voto   ?? tipo,
          },
        }));
      }
    } catch (error) {
      // Si falla revertimos al estado anterior
      setVotosComentarios(prev => ({ ...prev, [idComentario]: estadoActual }));
      setMensajeError(error?.response?.data?.mensaje || error?.message || "Error al votar el comentario");
      console.error("Error al votar comentario:", error);
    }
  }

  /**
   * Añade o quita el chollo de la lista de favoritos
   */
  async function toggleFavorito() {
    if (!usuario) return;

    try {
      const respuesta = await api.favoritos.toggle(id);
      setFavorito(respuesta.data.favorito);
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
    }
  }

  /**
   * Elimina el chollo y redirige al inicio
   */
  async function eliminarChollo() {
    try {
      await api.chollos.eliminar(id);
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar el chollo:", error);
    }
  }

  // Mostrar spinner mientras carga
  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 10 }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  // Mostrar mensaje si no se encontró el chollo
  if (!chollo) {
    return (
      <Box sx={{ p: 4, textAlign: "center", mt: 10 }}>
        <Typography variant="h4" gutterBottom>Chollo no encontrado</Typography>
        <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>
          Volver al Inicio
        </Button>
      </Box>
    );
  }

  // Cálculos para mostrar en el sidebar
  const esAutor             = usuario && chollo.usuarioId === usuario.id;
  const ahorro              = (chollo.precioOriginal - chollo.precioOferta).toFixed(2);
  const totalVotos          = (datosVoto.positivos + datosVoto.negativos) || 1;
  const porcentajePositivos = Math.round((datosVoto.positivos / totalVotos) * 100);

  return (
    <Box sx={{ pb: 5 }}>

      {/* Barra superior con título y botón de favorito */}
      <Box sx={{
        p: 2, bgcolor: "#e53935", color: "white",
        display: "flex", alignItems: "center", gap: 2,
      }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: "bold", flex: 1 }} noWrap>
          {chollo.titulo}
        </Typography>
        {usuario && (
          <IconButton onClick={toggleFavorito} sx={{ color: favorito ? "#ffcdd2" : "white" }}>
            <FavoriteIcon sx={{ color: favorito ? "#ff5252" : "white" }} />
          </IconButton>
        )}
      </Box>

      {/* Imagen principal del chollo */}
      <Box
        component="img"
        src={chollo.imagen}
        alt={chollo.titulo}
        sx={{ width: "100%", maxHeight: 400, objectFit: "cover" }}
      />

      {/* Contenido principal */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, mt: 1 }}>
        <Grid container spacing={3}>

          {/* Columna principal: info y comentarios */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 1,
                }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
                    {chollo.titulo}
                  </Typography>

                  {/* Botones de editar y eliminar solo para el autor */}
                  {esAutor && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/editar/${chollo.id}`)}
                        sx={{ bgcolor: "#ff7043", color: "white", fontWeight: "bold", "&:hover": { bgcolor: "#f4511e" } }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => setConfirmarBorrar(true)}
                        sx={{ fontWeight: "bold" }}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Descripción del chollo */}
                <Typography sx={{ mt: 2, fontSize: "1.1rem" }}>{chollo.descripcion}</Typography>

                {/* Etiquetas de categoría, ciudad y tienda */}
                <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {chollo.categoria && <Chip icon={<LocalOfferIcon />} label={chollo.categoria} />}
                  <Chip
                    icon={<LocationOnIcon />}
                    label={`${chollo.ciudad}${chollo.comunidad && chollo.comunidad !== chollo.ciudad ? `, ${chollo.comunidad}` : ""}`}
                  />
                  {chollo.tienda && <Chip icon={<StoreIcon />} label={chollo.tienda} />}
                </Box>
              </CardContent>
            </Card>

            {/* Sección de comentarios */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comentarios ({comentarios.length})
                </Typography>

                {/* Campo para escribir un comentario */}
                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder={usuario ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                    value={nuevoComentario}
                    onChange={e => setNuevoComentario(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarComentario()}
                    disabled={!usuario}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<SendIcon />}
                    onClick={enviarComentario}
                    disabled={!usuario || !nuevoComentario.trim() || enviandoCom}
                  >
                    Enviar
                  </Button>
                </Box>

                {/* Mensaje si no hay comentarios */}
                {comentarios.length === 0 && (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    Sé el primero en comentar este chollo.
                  </Typography>
                )}

                {/* Lista de comentarios */}
                {comentarios.map((c) => {
                  const nivel     = getNivel(c.puntos);
                  const votosCom  = votosComentarios[c.id] || { positivos: 0, negativos: 0, miVoto: null };
                  const yaVotoPos = votosCom.miVoto === "positivo";
                  const yaVotoNeg = votosCom.miVoto === "negativo";

                  return (
                    <Box key={c.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        {/* Avatar con el nivel del usuario */}
                        <Tooltip title={`${c.usuario} · ${c.puntos} pts`} arrow>
                          <Avatar sx={{
                            bgcolor: nivel.color, width: 40, height: 40,
                            fontSize: 16, fontWeight: "bold", flexShrink: 0,
                          }}>
                            {c.avatar}
                          </Avatar>
                        </Tooltip>

                        <Box sx={{ flex: 1 }}>
                          {/* Nombre, nivel y fecha del comentario */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography fontWeight="bold" fontSize={14}>{c.usuario}</Typography>
                            <BadgeReputacion puntos={c.puntos} />
                            <Typography variant="caption" color="text.secondary">· {c.fecha}</Typography>
                          </Box>

                          {/* Texto del comentario */}
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.comentario}</Typography>

                          {/* Botones de voto del comentario */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <Tooltip title={usuario ? "Útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => votarComentario(c.id, "positivo")}
                                  disabled={!usuario}
                                  sx={{ color: yaVotoPos ? "success.main" : "text.secondary", p: "4px" }}
                                >
                                  <ThumbUpIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 16, textAlign: "center", color: "success.main" }}>
                              {votosCom.positivos}
                            </Typography>

                            <Tooltip title={usuario ? "No útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => votarComentario(c.id, "negativo")}
                                  disabled={!usuario}
                                  sx={{ color: yaVotoNeg ? "error.main" : "text.secondary", p: "4px" }}
                                >
                                  <ThumbDownIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 16, textAlign: "center", color: "error.main" }}>
                              {votosCom.negativos}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar con precio, votos y compartir */}
          <Grid size={{ xs: 12, md: 4 }}>

            {/* Tarjeta de precio */}
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Precio oferta</Typography>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {chollo.precioOferta}€
                </Typography>
                <Typography sx={{ textDecoration: "line-through", color: "text.secondary", mt: 1 }}>
                  {chollo.precioOriginal}€
                </Typography>
                <Typography color="error" fontWeight="bold" sx={{ mt: 1 }}>
                  Ahorras {ahorro}€
                </Typography>
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  sx={{ mt: 3, fontWeight: "bold" }}
                  onClick={() => window.open(chollo.enlace || "#", "_blank")}
                >
                  IR A LA OFERTA
                </Button>
              </CardContent>
            </Card>

            {/* Tarjeta de valoración de la comunidad */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography gutterBottom fontWeight="bold">Valoración comunidad</Typography>
                <Typography variant="body2">{porcentajePositivos}% positivos</Typography>
                <LinearProgress
                  variant="determinate"
                  value={porcentajePositivos}
                  sx={{ my: 2, height: 8, borderRadius: 5 }}
                  color="success"
                />

                {/* Aviso si ya votó */}
                {datosVoto.miVoto && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Ya has votado este chollo
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    fullWidth
                    variant={datosVoto.miVoto === "positivo" ? "contained" : "outlined"}
                    color="success"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => votar("positivo")}
                    disabled={!usuario}
                  >
                    {datosVoto.positivos}
                  </Button>
                  <Button
                    fullWidth
                    variant={datosVoto.miVoto === "negativo" ? "contained" : "outlined"}
                    color="error"
                    startIcon={<ThumbDownIcon />}
                    onClick={() => votar("negativo")}
                    disabled={!usuario}
                  >
                    {datosVoto.negativos}
                  </Button>
                </Box>

                {/* Aviso para usuarios sin sesión */}
                {!usuario && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                    Inicia sesión para votar
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Botón para compartir el chollo */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Button
                  fullWidth
                  startIcon={<ShareIcon />}
                  variant="outlined"
                  color="primary"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                >
                  Compartir chollo
                </Button>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>

      {/* Diálogo de confirmación para eliminar el chollo */}
      <Dialog open={confirmarBorrar} onClose={() => setConfirmarBorrar(false)}>
        <DialogTitle sx={{ fontWeight: "bold" }}>¿Eliminar este chollo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a eliminar <strong>"{chollo.titulo}"</strong>. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmarBorrar(false)} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={eliminarChollo}>
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mostrar errores al votar */}
      <Snackbar
        open={!!mensajeError}
        autoHideDuration={4000}
        onClose={() => setMensajeError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setMensajeError(null)} sx={{ width: "100%" }}>
          {mensajeError}
        </Alert>
      </Snackbar>

    </Box>
  );
}

export default DetalleChollo;