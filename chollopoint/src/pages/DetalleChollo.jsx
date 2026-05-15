// 📄 DetalleChollo.jsx
// Todo conectado a la API: carga del chollo, comentarios, votos,
// favoritos y eliminación.

import React, { useState, useEffect } from "react";
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

import { useAuth }               from "../context/AuthContext";
import api                       from "../api/client";
import { normalizeChollo, normalizeComentario } from "../api/utils";

// ─── Sistema de niveles ───────────────────────────────────────────────────────
const NIVELES = [
  { nombre: "Novato",      min: 0,    max: 99,       color: "#78909c", icon: "🌱" },
  { nombre: "Cazachollos", min: 100,  max: 299,      color: "#42a5f5", icon: "🔍" },
  { nombre: "Experto",     min: 300,  max: 599,      color: "#ab47bc", icon: "⚡" },
  { nombre: "Leyenda",     min: 600,  max: 999,      color: "#ffa726", icon: "🔥" },
  { nombre: "Élite",       min: 1000, max: Infinity, color: "#e53935", icon: "👑" },
];

const getNivel = (puntos) =>
  NIVELES.find(n => puntos >= n.min && puntos <= n.max) || NIVELES[0];

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
export default function DetalleChollo() {
  const { id }                   = useParams();
  const navigate                 = useNavigate();
  const { usuario }              = useAuth();

  const [chollo,          setChollo]          = useState(null);
  const [comentarios,     setComentarios]     = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [favorito,        setFavorito]        = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [enviandoCom,     setEnviandoCom]     = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [errorMsg,        setErrorMsg]        = useState(null);
  const [datosVoto,       setDatosVoto]       = useState({
    positivos: 0, negativos: 0, miVoto: null,
  });

  // ── votosComentarios: { [idComentario]: { positivos: number, negativos: number, miVoto: "positivo"|"negativo"|null } }
  const [votosComentarios, setVotosComentarios] = useState({});

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    setCargando(true);

    Promise.all([
      api.chollos.ver(id),
      api.comentarios.listar(id),
    ])
      .then(([resChollo, resCom]) => {
        const c = normalizeChollo(resChollo.data.chollo);
        setChollo(c);
        setDatosVoto({
          positivos: c.votosPositivos,
          negativos: c.votosNegativos,
          miVoto:    c.miVoto,
        });

        const coms = (resCom.data.comentarios || []).map(normalizeComentario);
        setComentarios(coms);

        // Inicializar el estado de votos de cada comentario desde los datos de la API
        const votosIniciales = {};
        coms.forEach(com => {
          votosIniciales[com.id] = {
            positivos: com.votosPositivos ?? com.positivos ?? 0,
            negativos: com.votosNegativos ?? com.negativos ?? 0,
            miVoto:    com.miVoto ?? null,   // la API debe devolver miVoto en cada comentario
          };
        });
        setVotosComentarios(votosIniciales);
      })
      .catch(() => {})
      .finally(() => setCargando(false));

    // Comprobar si es favorito
    if (usuario) {
      api.favoritos.listar()
        .then((res) => {
          const favIds = (res.data.favoritos || []).map(f => f.id);
          setFavorito(favIds.includes(Number(id)));
        })
        .catch(() => {});
    }
  }, [id, usuario]);

  // ── Enviar comentario ─────────────────────────────────────────────────────
  const enviarComentario = async () => {
    if (!nuevoComentario.trim() || !usuario || enviandoCom) return;
    setEnviandoCom(true);
    try {
      const res = await api.comentarios.crear(id, nuevoComentario.trim());
      const nuevo = normalizeComentario(res.data.comentario);
      setComentarios(prev => [nuevo, ...prev]);
      // Inicializar sus votos a 0
      setVotosComentarios(prev => ({
        ...prev,
        [nuevo.id]: { positivos: 0, negativos: 0, miVoto: null },
      }));
      setNuevoComentario("");
    } catch (err) {
      console.error("Error al comentar:", err.message);
    } finally {
      setEnviandoCom(false);
    }
  };

  // ── Votar chollo ──────────────────────────────────────────────────────────
  const votar = async (tipo) => {
    if (!usuario || datosVoto.miVoto === tipo) return;
    try {
      const res = await api.chollos.votar(id, tipo);
      setDatosVoto({
        positivos: res.data.positivos,
        negativos: res.data.negativos,
        miVoto:    res.data.mi_voto,
      });
    } catch (err) {
      console.error("Error al votar:", err.message);
    }
  };

  // ── Votar comentario ──────────────────────────────────────────────────────
  // Backend: POST /api/comentarios/{idComentario}/votar
  // Body:     { "tipo": "positivo" | "negativo" }
  // Response: { "positivos": 3, "negativos": 1, "mi_voto": "positivo" }
  //           (también acepta el formato antiguo: { "votos": 5, "mi_voto": "positivo" })
  const votarComentario = async (idComentario, tipo) => {
    if (!usuario) return;

    const estadoActual = votosComentarios[idComentario] || { positivos: 0, negativos: 0, miVoto: null };

    // Si ya votó lo mismo, ignorar
    if (estadoActual.miVoto === tipo) return;

    // ── Actualización optimista: el UI responde al instante ──
    const anteriorVoto = estadoActual.miVoto;
    const nuevoEstado = {
      positivos: estadoActual.positivos
        + (tipo === "positivo" ? 1 : 0)
        - (anteriorVoto === "positivo" ? 1 : 0),
      negativos: estadoActual.negativos
        + (tipo === "negativo" ? 1 : 0)
        - (anteriorVoto === "negativo" ? 1 : 0),
      miVoto: tipo,
    };
    setVotosComentarios(prev => ({ ...prev, [idComentario]: nuevoEstado }));

    try {
      const res = await api.comentarios.votar(idComentario, tipo);
      // Si la API devuelve los datos reales, los usamos; si no, mantenemos el optimista
      const d = res.data;
      if (d.positivos !== undefined || d.negativos !== undefined) {
        setVotosComentarios(prev => ({
          ...prev,
          [idComentario]: {
            positivos: d.positivos ?? nuevoEstado.positivos,
            negativos: d.negativos ?? nuevoEstado.negativos,
            miVoto:    d.mi_voto  ?? tipo,
          },
        }));
      }
    } catch (err) {
      // Revertir al estado anterior si falla
      setVotosComentarios(prev => ({ ...prev, [idComentario]: estadoActual }));
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al votar el comentario";
      setErrorMsg(msg);
      console.error("Error al votar comentario:", err);
    }
  };

  // ── Toggle favorito ───────────────────────────────────────────────────────
  const toggleFavorito = async () => {
    if (!usuario) return;
    try {
      const res = await api.favoritos.toggle(id);
      setFavorito(res.data.favorito);
    } catch (err) {
      console.error("Error al guardar favorito:", err.message);
    }
  };

  // ── Eliminar chollo ───────────────────────────────────────────────────────
  const eliminarChollo = async () => {
    try {
      await api.chollos.eliminar(id);
      navigate("/");
    } catch (err) {
      console.error("Error al eliminar:", err.message);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 10 }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

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

  const esAutor             = usuario && chollo.usuarioId === usuario.id;
  const ahorro              = (chollo.precioOriginal - chollo.precioOferta).toFixed(2);
  const totalVotos          = (datosVoto.positivos + datosVoto.negativos) || 1;
  const porcentajePositivos = Math.round((datosVoto.positivos / totalVotos) * 100);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pb: 5 }}>

      {/* ── Barra superior ── */}
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

      {/* ── Imagen principal ── */}
      <Box
        component="img"
        src={chollo.imagen}
        alt={chollo.titulo}
        sx={{ width: "100%", maxHeight: 400, objectFit: "cover" }}
      />

      {/* ── Contenido ── */}
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, mt: 1 }}>
        <Grid container spacing={3}>

          {/* ── COLUMNA PRINCIPAL ── */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
                    {chollo.titulo}
                  </Typography>

                  {/* Botones autor */}
                  {esAutor && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="contained" size="small" startIcon={<EditIcon />}
                        onClick={() => navigate(`/editar/${chollo.id}`)}
                        sx={{ bgcolor:"#ff7043", color:"white", fontWeight:"bold",
                          "&:hover":{bgcolor:"#f4511e"} }}>
                        Editar
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<DeleteIcon />}
                        color="error" onClick={() => setConfirmarBorrar(true)}
                        sx={{ fontWeight:"bold" }}>
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </Box>

                <Typography sx={{ mt: 2, fontSize: "1.1rem" }}>{chollo.descripcion}</Typography>
                <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {chollo.categoria && <Chip icon={<LocalOfferIcon />} label={chollo.categoria} />}
                  <Chip icon={<LocationOnIcon />}
                    label={`${chollo.ciudad}${chollo.comunidad && chollo.comunidad !== chollo.ciudad ? `, ${chollo.comunidad}` : ""}`} />
                  {chollo.tienda && <Chip icon={<StoreIcon />} label={chollo.tienda} />}
                </Box>
              </CardContent>
            </Card>

            {/* ── COMENTARIOS ── */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comentarios ({comentarios.length})
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder={usuario
                      ? "Escribe un comentario..."
                      : "Inicia sesión para comentar"}
                    value={nuevoComentario}
                    onChange={e => setNuevoComentario(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarComentario()}
                    disabled={!usuario}
                  />
                  <Button variant="contained" color="error"
                    startIcon={<SendIcon />}
                    onClick={enviarComentario}
                    disabled={!usuario || !nuevoComentario.trim() || enviandoCom}>
                    Enviar
                  </Button>
                </Box>

                {comentarios.length === 0 && (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    Sé el primero en comentar este chollo.
                  </Typography>
                )}

                {comentarios.map((c) => {
                  const nivel      = getNivel(c.puntos);
                  const votosCom   = votosComentarios[c.id] || { positivos: 0, negativos: 0, miVoto: null };
                  const yaVotoPos  = votosCom.miVoto === "positivo";
                  const yaVotoNeg  = votosCom.miVoto === "negativo";

                  return (
                    <Box key={c.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <Tooltip title={`${c.usuario} · ${c.puntos} pts`} arrow>
                          <Avatar sx={{ bgcolor: nivel.color, width: 40, height: 40,
                            fontSize: 16, fontWeight: "bold", flexShrink: 0 }}>
                            {c.avatar}
                          </Avatar>
                        </Tooltip>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center",
                            gap: 1, flexWrap: "wrap" }}>
                            <Typography fontWeight="bold" fontSize={14}>{c.usuario}</Typography>
                            <BadgeReputacion puntos={c.puntos} />
                            <Typography variant="caption" color="text.secondary">
                              · {c.fecha}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {c.comentario}
                          </Typography>

                          {/* ── Votos del comentario ── */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <Tooltip title={usuario ? "Útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => votarComentario(c.id, "positivo")}
                                  disabled={!usuario}
                                  sx={{
                                    color: yaVotoPos ? "success.main" : "text.secondary",
                                    p: "4px",
                                  }}
                                >
                                  <ThumbUpIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                minWidth: 16,
                                textAlign: "center",
                                color: "success.main",
                              }}
                            >
                              {votosCom.positivos}
                            </Typography>
                            <Tooltip title={usuario ? "No útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => votarComentario(c.id, "negativo")}
                                  disabled={!usuario}
                                  sx={{
                                    color: yaVotoNeg ? "error.main" : "text.secondary",
                                    p: "4px",
                                  }}
                                >
                                  <ThumbDownIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                minWidth: 16,
                                textAlign: "center",
                                color: "error.main",
                              }}
                            >
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

          {/* ── SIDEBAR ── */}
          <Grid size={{ xs: 12, md: 4 }}>
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
                <Button variant="contained" color="warning" fullWidth size="large"
                  startIcon={<ShoppingCartIcon />}
                  sx={{ mt: 3, fontWeight: "bold" }}
                  onClick={() => window.open(chollo.enlace || "#", "_blank")}>
                  IR A LA OFERTA
                </Button>
              </CardContent>
            </Card>

            {/* Votos del chollo */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography gutterBottom fontWeight="bold">Valoración comunidad</Typography>
                <Typography variant="body2">{porcentajePositivos}% positivos</Typography>
                <LinearProgress variant="determinate" value={porcentajePositivos}
                  sx={{ my: 2, height: 8, borderRadius: 5 }} color="success" />

                {datosVoto.miVoto && (
                  <Typography variant="caption" color="text.secondary"
                    sx={{ display: "block", mb: 1 }}>
                    Ya has votado este chollo
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button fullWidth
                    variant={datosVoto.miVoto === "positivo" ? "contained" : "outlined"}
                    color="success" startIcon={<ThumbUpIcon />}
                    onClick={() => votar("positivo")}
                    disabled={!usuario}>
                    {datosVoto.positivos}
                  </Button>
                  <Button fullWidth
                    variant={datosVoto.miVoto === "negativo" ? "contained" : "outlined"}
                    color="error" startIcon={<ThumbDownIcon />}
                    onClick={() => votar("negativo")}
                    disabled={!usuario}>
                    {datosVoto.negativos}
                  </Button>
                </Box>

                {!usuario && (
                  <Typography variant="caption" color="text.secondary"
                    sx={{ display: "block", mt: 1, textAlign: "center" }}>
                    Inicia sesión para votar
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Button fullWidth startIcon={<ShareIcon />}
                  variant="outlined" color="primary"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                  Compartir chollo
                </Button>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>

      {/* ── Diálogo confirmar borrado ── */}
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
          <Button variant="contained" color="error" startIcon={<DeleteIcon />}
            onClick={eliminarChollo}>
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar de errores ── */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ width: "100%" }}>
          {errorMsg}
        </Alert>
      </Snackbar>

    </Box>
  );
}