import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Button,
  Chip, Avatar, TextField, IconButton, LinearProgress, Divider, Tooltip,
  CircularProgress, Dialog, DialogTitle, DialogContent, Stack, Snackbar,
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
import WhatsAppIcon     from "@mui/icons-material/WhatsApp";
import TelegramIcon     from "@mui/icons-material/Telegram";
import ContentCopyIcon  from "@mui/icons-material/ContentCopy";
import { useAuth }      from "../context/AuthContext";
import api              from "../api/client";
import { normalizeChollo, normalizeComentario } from "../api/utils";

const NIVELES = [
  { nombre: "Novato",      min: 0,    max: 99,       color: "#78909c", icon: "🌱" },
  { nombre: "Cazachollos", min: 100,  max: 299,      color: "#42a5f5", icon: "🔍" },
  { nombre: "Experto",     min: 300,  max: 599,      color: "#ab47bc", icon: "⚡" },
  { nombre: "Leyenda",     min: 600,  max: 999,      color: "#ffa726", icon: "🔥" },
  { nombre: "Élite",       min: 1000, max: Infinity, color: "#e53935", icon: "👑" },
];

function getNivel(puntos) {
  for (let i = 0; i < NIVELES.length; i++) {
    const nivel = NIVELES[i];
    if (puntos >= nivel.min && puntos <= nivel.max) return nivel;
  }
  return NIVELES[0];
}

function BadgeReputacion({ puntos }) {
  const nivel = getNivel(puntos);
  const colorFondo = nivel.color + "22";
  return (
    <Tooltip title={`${puntos} puntos`} arrow placement="top">
      <Chip
        label={`${nivel.icon} ${nivel.nombre}`}
        size="small"
        sx={{ bgcolor: colorFondo, color: nivel.color, fontWeight: "bold", fontSize: 11, height: 20, cursor: "default" }}
      />
    </Tooltip>
  );
}

function DetalleChollo() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const [chollo, setChollo]                     = useState(null);
  const [comentarios, setComentarios]           = useState([]);
  const [favorito, setFavorito]                 = useState(false);
  const [datosVoto, setDatosVoto]               = useState({ positivos: 0, negativos: 0, miVoto: null });
  const [votosComentarios, setVotosComentarios] = useState({});
  const [nuevoComentario, setNuevoComentario]   = useState("");
  const [cargando, setCargando]                 = useState(true);
  const [enviandoCom, setEnviandoCom]           = useState(false);
  const [dialogCompartir, setDialogCompartir]   = useState(false);
  const [copiadoSnack, setCopiadoSnack]         = useState(false);

  useEffect(() => {
    async function fetchChollo() {
      try {
        setCargando(true);
        const resChollo = await api.chollos.ver(id);
        const c = normalizeChollo(resChollo.data.chollo);
        setChollo(c);
        setDatosVoto({ positivos: c.votosPositivos, negativos: c.votosNegativos, miVoto: c.miVoto });

        const resCom = await api.comentarios.listar(id);
        const comsNormalizados = resCom.data.comentarios.map(normalizeComentario);
        setComentarios(comsNormalizados);

        const votosDeComentarios = {};
        for (const com of comsNormalizados) {
          let positivos = com.votosPositivos ?? com.positivos ?? 0;
          let negativos = com.votosNegativos ?? com.negativos ?? 0;
          let miVoto    = com.miVoto ?? null;
          votosDeComentarios[com.id] = { positivos, negativos, miVoto };
        }
        setVotosComentarios(votosDeComentarios);
      } catch (error) {
        alert(error.mensaje || "Error al cargar el chollo");
      }
      setCargando(false);
    }
    fetchChollo();
  }, [id]);

  useEffect(() => {
    async function fetchFavoritos() {
      try {
        const res = await api.favoritos.listar();
        const esFavorito = res.data.favoritos.some(fav => fav.id === Number(id));
        setFavorito(esFavorito);
      } catch {}
    }
    if (usuario) fetchFavoritos();
  }, [id, usuario]);

  async function handleEnviarComentario() {
    if (nuevoComentario.trim() === "" || !usuario || enviandoCom) return;
    setEnviandoCom(true);
    try {
      const res = await api.comentarios.crear(id, nuevoComentario.trim());
      const nuevo = normalizeComentario(res.data.comentario);
      setComentarios([nuevo, ...comentarios]);
      setVotosComentarios({ ...votosComentarios, [nuevo.id]: { positivos: 0, negativos: 0, miVoto: null } });
      setNuevoComentario("");
    } catch (error) {
      alert(error.mensaje || "Error al enviar el comentario");
    }
    setEnviandoCom(false);
  }

  function handleKeyDownComentario(e) {
    if (e.key === "Enter" && !e.shiftKey) handleEnviarComentario();
  }

  async function handleVotarChollo(tipo) {
    if (!usuario || datosVoto.miVoto === tipo) return;
    try {
      const res = await api.chollos.votar(id, tipo);
      setDatosVoto({ positivos: res.data.positivos, negativos: res.data.negativos, miVoto: res.data.mi_voto });
    } catch (error) {
      alert(error.mensaje || "Error al votar el chollo");
    }
  }

  async function handleVotarComentario(idComentario, tipo) {
    if (!usuario) return;
    let estadoActual = votosComentarios[idComentario] || { positivos: 0, negativos: 0, miVoto: null };
    if (estadoActual.miVoto === tipo) return;

    const anteriorVoto = estadoActual.miVoto;
    let nuevosPositivos = estadoActual.positivos;
    let nuevosNegativos = estadoActual.negativos;
    if (tipo === "positivo") nuevosPositivos++;
    if (anteriorVoto === "positivo") nuevosPositivos--;
    if (tipo === "negativo") nuevosNegativos++;
    if (anteriorVoto === "negativo") nuevosNegativos--;

    const estadoOptimista = { positivos: nuevosPositivos, negativos: nuevosNegativos, miVoto: tipo };
    setVotosComentarios({ ...votosComentarios, [idComentario]: estadoOptimista });

    try {
      const res = await api.comentarios.votar(idComentario, tipo);
      const d = res.data;
      if (d.positivos !== undefined || d.negativos !== undefined) {
        setVotosComentarios({
          ...votosComentarios,
          [idComentario]: {
            positivos: d.positivos ?? estadoOptimista.positivos,
            negativos: d.negativos ?? estadoOptimista.negativos,
            miVoto:    d.mi_voto  ?? tipo,
          },
        });
      }
    } catch (error) {
      setVotosComentarios({ ...votosComentarios, [idComentario]: estadoActual });
      alert(error.mensaje || "Error al votar el comentario");
    }
  }

  async function handleToggleFavorito() {
    if (!usuario) return;
    try {
      const res = await api.favoritos.toggle(id);
      setFavorito(res.data.favorito);
    } catch (error) {
      alert(error.mensaje || "Error al guardar favorito");
    }
  }

  function handleCompartir() {
    if (navigator.share) {
      navigator.share({
        title: chollo.titulo,
        text: `¡Mira este chollo! ${chollo.titulo} por solo ${chollo.precioOferta}€`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setDialogCompartir(true);
    }
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const el = document.createElement("textarea");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiadoSnack(true);
  }

  function handleIrALaOferta() {
    if (!chollo.enlace) return;
    window.open(chollo.enlace, "_blank", "noopener,noreferrer");
  }

  async function handleEliminarChollo() {
    if (!window.confirm(`¿Eliminar el chollo "${chollo.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.chollos.eliminar(id);
      navigate("/");
    } catch (error) {
      alert(error.mensaje || "Error al eliminar el chollo");
    }
  }

  async function handleEliminarComentario(idComentario) {
    if (!window.confirm("¿Eliminar este comentario? Esta acción no se puede deshacer.")) return;
    try {
      await api.comentarios.eliminar(idComentario);
      setComentarios(prev => prev.filter(c => c.id !== idComentario));
    } catch (error) {
      alert(error.mensaje || "Error al eliminar el comentario");
    }
  }

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
        <Button variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>Volver al Inicio</Button>
      </Box>
    );
  }

  const esAutor = usuario !== null && (chollo.usuarioId === usuario.id || usuario.rol === "admin");
  const ahorro = (chollo.precioOriginal - chollo.precioOferta).toFixed(2);
  let totalVotos = datosVoto.positivos + datosVoto.negativos || 1;
  const porcentajePositivos = Math.round((datosVoto.positivos / totalVotos) * 100);
  let etiquetaUbicacion = chollo.ciudad;
  if (chollo.comunidad !== "" && chollo.comunidad !== chollo.ciudad) etiquetaUbicacion += `, ${chollo.comunidad}`;
  const botonEnviarDesactivado = !usuario || nuevoComentario.trim() === "" || enviandoCom;
  const colorIconoFavorito = favorito ? "#ff5252" : "white";
  const colorBotonFavorito = favorito ? "#ffcdd2" : "white";
  const urlChollo  = window.location.href;
  const textoCorto = `¡Mira este chollo! ${chollo.titulo} por solo ${chollo.precioOferta}€`;

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ p: 2, bgcolor: "#e53935", color: "white", display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "white" }}><CloseIcon /></IconButton>
        <Typography variant="h6" sx={{ fontWeight: "bold", flex: 1 }} noWrap>{chollo.titulo}</Typography>
        {usuario && (
          <IconButton onClick={handleToggleFavorito} sx={{ color: colorBotonFavorito }}>
            <FavoriteIcon sx={{ color: colorIconoFavorito }} />
          </IconButton>
        )}
      </Box>

      <Box component="img" src={chollo.imagen} alt={chollo.titulo} sx={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, mt: 1 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>{chollo.titulo}</Typography>
                  {esAutor && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="contained" size="small" startIcon={<EditIcon />}
                        onClick={() => navigate(`/editar/${chollo.id}`)}
                        sx={{ bgcolor: "#ff7043", color: "white", fontWeight: "bold", "&:hover": { bgcolor: "#f4511e" } }}>
                        Editar
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<DeleteIcon />}
                        color="error" onClick={handleEliminarChollo} sx={{ fontWeight: "bold" }}>
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </Box>

                <Typography sx={{ mt: 2, fontSize: "1.1rem" }}>{chollo.descripcion}</Typography>

                <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {chollo.categoria && <Chip icon={<LocalOfferIcon />} label={chollo.categoria} />}
                  <Chip icon={<LocationOnIcon />} label={etiquetaUbicacion} />
                  {chollo.tienda && <Chip icon={<StoreIcon />} label={chollo.tienda} />}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Comentarios ({comentarios.length})</Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                  <TextField fullWidth
                    placeholder={usuario ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    onKeyDown={handleKeyDownComentario}
                    disabled={!usuario}
                  />
                  <Button variant="contained" color="error" startIcon={<SendIcon />}
                    onClick={handleEnviarComentario} disabled={botonEnviarDesactivado}>
                    Enviar
                  </Button>
                </Box>

                {comentarios.length === 0 && (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    Sé el primero en comentar este chollo.
                  </Typography>
                )}

                {comentarios.map((c) => {
                  const nivel = getNivel(c.puntos);
                  const votosCom = votosComentarios[c.id] || { positivos: 0, negativos: 0, miVoto: null };
                  const yaVotoPos = votosCom.miVoto === "positivo";
                  const yaVotoNeg = votosCom.miVoto === "negativo";
                  const colorVotoPos = yaVotoPos ? "success.main" : "text.secondary";
                  const colorVotoNeg = yaVotoNeg ? "error.main"   : "text.secondary";

                  return (
                    <Box key={c.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <Tooltip title={`${c.usuario} · ${c.puntos} pts`} arrow>
                          <Avatar sx={{ bgcolor: nivel.color, width: 40, height: 40, fontSize: 16, fontWeight: "bold", flexShrink: 0 }}>
                            {c.avatar}
                          </Avatar>
                        </Tooltip>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography fontWeight="bold" fontSize={14}>{c.usuario}</Typography>
                            <BadgeReputacion puntos={c.puntos} />
                            <Typography variant="caption" color="text.secondary">· {c.fecha}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>{c.comentario}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            <Tooltip title={usuario ? "Útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton size="small" onClick={() => handleVotarComentario(c.id, "positivo")}
                                  disabled={!usuario} sx={{ color: colorVotoPos, p: "4px" }}>
                                  <ThumbUpIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 16, textAlign: "center", color: "success.main" }}>
                              {votosCom.positivos}
                            </Typography>
                            <Tooltip title={usuario ? "No útil" : "Inicia sesión para votar"} arrow>
                              <span>
                                <IconButton size="small" onClick={() => handleVotarComentario(c.id, "negativo")}
                                  disabled={!usuario} sx={{ color: colorVotoNeg, p: "4px" }}>
                                  <ThumbDownIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontWeight: "bold", minWidth: 16, textAlign: "center", color: "error.main" }}>
                              {votosCom.negativos}
                            </Typography>
                            {usuario?.rol === "admin" && (
                              <Tooltip title="Eliminar comentario (admin)" arrow>
                                <IconButton size="small" onClick={() => handleEliminarComentario(c.id)}
                                  sx={{ color: "error.main", p: "4px", ml: 1 }}>
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
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

          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Precio oferta</Typography>
                <Typography variant="h3" color="success.main" fontWeight="bold">{chollo.precioOferta}€</Typography>
                <Typography sx={{ textDecoration: "line-through", color: "text.secondary", mt: 1 }}>{chollo.precioOriginal}€</Typography>
                <Typography color="error" fontWeight="bold" sx={{ mt: 1 }}>Ahorras {ahorro}€</Typography>
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  sx={{ mt: 3, fontWeight: "bold" }}
                  onClick={handleIrALaOferta}
                  disabled={!chollo.enlace}
                >
                  {chollo.enlace ? "IR A LA OFERTA" : "Sin enlace disponible"}
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography gutterBottom fontWeight="bold">Valoración comunidad</Typography>
                <Typography variant="body2">{porcentajePositivos}% positivos</Typography>
                <LinearProgress variant="determinate" value={porcentajePositivos}
                  sx={{ my: 2, height: 8, borderRadius: 5 }} color="success" />
                {datosVoto.miVoto && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Ya has votado este chollo
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button fullWidth variant={datosVoto.miVoto === "positivo" ? "contained" : "outlined"}
                    color="success" startIcon={<ThumbUpIcon />}
                    onClick={() => handleVotarChollo("positivo")} disabled={!usuario}>
                    {datosVoto.positivos}
                  </Button>
                  <Button fullWidth variant={datosVoto.miVoto === "negativo" ? "contained" : "outlined"}
                    color="error" startIcon={<ThumbDownIcon />}
                    onClick={() => handleVotarChollo("negativo")} disabled={!usuario}>
                    {datosVoto.negativos}
                  </Button>
                </Box>
                {!usuario && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                    Inicia sesión para votar
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Button fullWidth startIcon={<ShareIcon />} variant="outlined" color="primary" onClick={handleCompartir}>
                  Compartir chollo
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={dialogCompartir} onClose={() => setDialogCompartir(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>
          Compartir chollo
          <IconButton onClick={() => setDialogCompartir(false)} sx={{ position: "absolute", right: 8, top: 8, color: "text.secondary" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Button
              fullWidth variant="contained" startIcon={<WhatsAppIcon />}
              sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#1ebe57" }, fontWeight: "bold", justifyContent: "flex-start", borderRadius: 2 }}
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${textoCorto}\n${urlChollo}`)}`, "_blank", "noopener")}
            >
              WhatsApp
            </Button>
            <Button
              fullWidth variant="contained" startIcon={<TelegramIcon />}
              sx={{ bgcolor: "#0088cc", "&:hover": { bgcolor: "#0077b3" }, fontWeight: "bold", justifyContent: "flex-start", borderRadius: 2 }}
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(urlChollo)}&text=${encodeURIComponent(textoCorto)}`, "_blank", "noopener")}
            >
              Telegram
            </Button>
            <Button
              fullWidth variant="contained"
              startIcon={<Typography sx={{ fontWeight: "bold", fontSize: 15, lineHeight: 1, color: "white" }}>𝕏</Typography>}
              sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" }, fontWeight: "bold", justifyContent: "flex-start", borderRadius: 2 }}
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Chollo! ${chollo.titulo} por ${chollo.precioOferta}€`)}&url=${encodeURIComponent(urlChollo)}`, "_blank", "noopener")}
            >
              X (Twitter)
            </Button>
            <Divider />
            <Button
              fullWidth variant="outlined" startIcon={<ContentCopyIcon />}
              sx={{ fontWeight: "bold", justifyContent: "flex-start", borderRadius: 2 }}
              onClick={() => { copiarEnlace(); setDialogCompartir(false); }}
            >
              Copiar enlace
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={copiadoSnack}
        autoHideDuration={2500}
        onClose={() => setCopiadoSnack(false)}
        message="✅ Enlace copiado al portapapeles"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}

export default DetalleChollo;
