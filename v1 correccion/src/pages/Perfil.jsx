import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Paper, Typography, Avatar, Button,
  Divider, Chip, TextField, Stack, Alert, Tooltip, Tabs, Tab, LinearProgress,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  IconButton, CircularProgress,
} from "@mui/material";
import LogoutIcon      from "@mui/icons-material/Logout";
import SaveIcon        from "@mui/icons-material/Save";
import PersonIcon      from "@mui/icons-material/Person";
import LocationOnIcon  from "@mui/icons-material/LocationOn";
import CakeIcon        from "@mui/icons-material/Cake";
import PhoneIcon       from "@mui/icons-material/Phone";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WhatshotIcon    from "@mui/icons-material/Whatshot";
import StarIcon        from "@mui/icons-material/Star";
import EditIcon        from "@mui/icons-material/Edit";
import DeleteIcon      from "@mui/icons-material/Delete";
import AddIcon         from "@mui/icons-material/Add";
import { useAuth }     from "../context/AuthContext";
import api             from "../api/client";
import { normalizeChollo } from "../api/utils";

const COLORES_AVATAR = [
  { bg: "linear-gradient(135deg, #e53935, #ff7043)", label: "Rojo"    },
  { bg: "linear-gradient(135deg, #1976d2, #42a5f5)", label: "Azul"    },
  { bg: "linear-gradient(135deg, #2e7d32, #66bb6a)", label: "Verde"   },
  { bg: "linear-gradient(135deg, #6a1b9a, #ab47bc)", label: "Morado"  },
  { bg: "linear-gradient(135deg, #e65100, #ffa726)", label: "Naranja" },
  { bg: "linear-gradient(135deg, #00695c, #26a69a)", label: "Teal"    },
];

const COLORES_CATEGORIAS = {
  "Electrónica":  "#1976d2",
  "Moda":         "#c2185b",
  "Hogar":        "#6a1b9a",
  "Alimentación": "#e65100",
  "Deportes":     "#2e7d32",
  "Viajes":       "#00695c",
  "Servicios":    "#ffa726",
  "Otros":        "#78909c",
};

const NIVELES = [
  { nombre: "Novato",      min: 0,    max: 99,       color: "#78909c", icon: "🌱" },
  { nombre: "Cazachollos", min: 100,  max: 299,      color: "#42a5f5", icon: "🔍" },
  { nombre: "Experto",     min: 300,  max: 599,      color: "#ab47bc", icon: "⚡" },
  { nombre: "Leyenda",     min: 600,  max: 999,      color: "#ffa726", icon: "🔥" },
  { nombre: "Élite",       min: 1000, max: Infinity, color: "#e53935", icon: "👑" },
];

const getNivel = (puntos) => NIVELES.find(n => puntos >= n.min && puntos <= n.max) || NIVELES[0];

const BADGES = [
  { id: "primer_chollo", icono: "🏆", nombre: "Primer Chollo",   desc: "Publicaste tu primer chollo",          ganado: true  },
  { id: "comentarista",  icono: "💬", nombre: "Comentarista",    desc: "Escribiste 5 comentarios",             ganado: true  },
  { id: "validador",     icono: "✅", nombre: "Validador",       desc: "Recibiste 10 votos positivos",         ganado: true  },
  { id: "explorador",    icono: "🗺️", nombre: "Explorador",      desc: "Usaste el mapa de chollos",            ganado: false },
  { id: "veterano",      icono: "⭐", nombre: "Veterano",        desc: "Llevas más de 30 días en la comunidad",ganado: false },
  { id: "top_chollo",    icono: "👑", nombre: "Top Chollo",      desc: "Un chollo tuyo llegó a 50 votos",      ganado: false },
];

const PROVINCIAS = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila",
  "Badajoz","Barcelona","Burgos","Cáceres","Cádiz","Cantabria",
  "Castellón","Ciudad Real","Córdoba","Cuenca","Gerona","Granada",
  "Guadalajara","Guipúzcoa","Huelva","Huesca","Islas Baleares",
  "Jaén","La Coruña","La Rioja","Las Palmas","León","Lérida",
  "Lugo","Madrid","Málaga","Murcia","Navarra","Orense","Palencia",
  "Pontevedra","Salamanca","Santa Cruz de Tenerife","Segovia",
  "Sevilla","Soria","Tarragona","Teruel","Toledo","Valencia",
  "Valladolid","Vizcaya","Zamora","Zaragoza",
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function Perfil() {
  const { usuario, logout, actualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [tabActual,      setTabActual]      = useState(0);
  const [guardado,       setGuardado]       = useState(false);
  const [errorForm,      setErrorForm]      = useState("");
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [misDeals,         setMisDeals]         = useState([]);
  const [cargandoChollos,  setCargandoChollos]  = useState(true);
  const [dealAEliminar,    setDealAEliminar]     = useState(null);

  useEffect(() => {
    if (!usuario) return;
    setCargandoChollos(true);
    api.chollos.listar({ por_pagina: 100, solo_activos: 0 })
      .then((res) => {
        const todos = (res.data.chollos || []).map(normalizeChollo);
        setMisDeals(todos.filter(d => d.usuarioId === usuario.id));
      })
      .catch(() => {})
      .finally(() => setCargandoChollos(false));
  }, [usuario]);

  
  const categoriasFavoritas = Object.entries(
    misDeals.reduce((acc, d) => {
      if (d.categoria) acc[d.categoria] = (acc[d.categoria] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([nombre, interacciones]) => ({
      nombre,
      interacciones,
      color: COLORES_CATEGORIAS[nombre] || "#78909c",
    }))
    .sort((a, b) => b.interacciones - a.interacciones);

  const [tNombre,      setTNombre]      = useState(usuario?.nombre      || "");
  const [tAlias,       setTAlias]       = useState(usuario?.alias       || "");
  const [tBio,         setTBio]         = useState(usuario?.bio         || "");
  const [tColorAvatar, setTColorAvatar] = useState(usuario?.color_avatar || 0);
  const [tCiudad,      setTCiudad]      = useState(usuario?.ciudad      || "");
  const [tProvincia,   setTProvincia]   = useState(usuario?.provincia   || "");
  const [tFechaNac,    setTFechaNac]    = useState(usuario?.fecha_nac   || "");
  const [tTelefono,    setTTelefono]    = useState(usuario?.telefono    || "");

  const puntos   = usuario?.puntos || 0;
  const nivel    = getNivel(puntos);
  const sigNivel = NIVELES[NIVELES.indexOf(nivel) + 1];
  const progreso = sigNivel ? Math.round(((puntos - nivel.min) / (sigNivel.min - nivel.min)) * 100) : 100;

  if (!usuario) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h5" gutterBottom>Necesitas iniciar sesión para ver tu perfil</Typography>
        <Button variant="contained" onClick={() => navigate("/login")}
          sx={{ mt: 2, background: "linear-gradient(90deg, #e53935, #ff7043)" }}>
          Ir al Login
        </Button>
      </Box>
    );
  }

  const guardarCambios = async () => {
    if (!tNombre.trim()) { setErrorForm("El nombre no puede estar vacío."); return; }
    if (tTelefono && !/^[0-9+ ]{7,15}$/.test(tTelefono)) { setErrorForm("El teléfono no tiene un formato válido."); return; }
    setCargandoPerfil(true);
    setErrorForm("");
    try {
      const res = await api.usuario.actualizar({
        nombre:       tNombre.trim(),
        alias:        tAlias.trim()    || null,
        bio:          tBio.trim()      || null,
        color_avatar: tColorAvatar,
        ciudad:       tCiudad.trim()   || null,
        provincia:    tProvincia       || null,
        fecha_nac:    tFechaNac        || null,
        telefono:     tTelefono.trim() || null,
      });
      actualizarUsuario(res.data.usuario);
      setGuardado(true);
      setTabActual(0);
    } catch (err) {
      setErrorForm(err.message || "Error al guardar los cambios");
    } finally {
      setCargandoPerfil(false);
    }
  };

  const confirmarEliminar = (deal) => setDealAEliminar(deal);
  const ejecutarEliminar  = async () => {
    if (!dealAEliminar) return;
    try {
      await api.chollos.eliminar(dealAEliminar.id);
      setMisDeals(prev => prev.filter(d => d.id !== dealAEliminar.id));
    } catch (err) {
      console.error("Error al eliminar:", err.message);
    } finally {
      setDealAEliminar(null);
    }
  };

  const inicial        = usuario.avatar || usuario.nombre.charAt(0).toUpperCase();
  const colorAvatarIdx = usuario.color_avatar ?? tColorAvatar;

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: 5 }}>
      {guardado && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setGuardado(false)}>✅ Perfil actualizado correctamente</Alert>}

      <Paper elevation={4} sx={{ p: 3, borderRadius: 4, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          <Avatar sx={{ width: 80, height: 80, fontSize: 36, background: COLORES_AVATAR[colorAvatarIdx]?.bg || COLORES_AVATAR[0].bg }}>{inicial}</Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">{usuario.nombre}</Typography>
            {usuario.alias && <Typography color="text.secondary">@{usuario.alias}</Typography>}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              <Chip label={`${nivel.icon} ${nivel.nombre}`} size="small" sx={{ bgcolor: nivel.color + "22", color: nivel.color, fontWeight: "bold" }} />
              <Chip icon={<PersonIcon />} label="Verificado" color="success" size="small" />
              {usuario.ciudad && <Chip icon={<LocationOnIcon />} label={usuario.ciudad} size="small" variant="outlined" />}
            </Stack>
          </Box>
          <Stack spacing={1}>
            <Button variant="contained" onClick={() => setTabActual(2)}
              sx={{ fontWeight: "bold", background: "linear-gradient(90deg, #e53935, #ff7043)", "&:hover": { background: "linear-gradient(90deg, #c62828, #e64a19)" } }}>
              ✏️ Editar perfil
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={() => { logout(); navigate("/"); }}>
              Cerrar sesión
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 4, overflow: "hidden" }}>
        <Tabs value={tabActual} onChange={(_, v) => setTabActual(v)}
          sx={{ borderBottom: "1px solid #eee", "& .MuiTab-root": { fontWeight: "bold", textTransform: "none", fontSize: 15 }, "& .Mui-selected": { color: "#e53935" }, "& .MuiTabs-indicator": { bgcolor: "#e53935" } }}>
          <Tab label="🪪 Perfil" />
          <Tab label="📊 Actividad" />
          <Tab label="⚙️ Ajustes" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabActual} index={0}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Datos personales</Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PersonIcon sx={{ color: "text.secondary" }} />
                <Box><Typography variant="caption" color="text.secondary">Correo</Typography><Typography>{usuario.email}</Typography></Box>
              </Box>
              {usuario.bio && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <StarIcon sx={{ color: "text.secondary" }} />
                  <Box><Typography variant="caption" color="text.secondary">Sobre mí</Typography><Typography fontStyle="italic">"{usuario.bio}"</Typography></Box>
                </Box>
              )}
              {(usuario.ciudad || usuario.provincia) && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LocationOnIcon sx={{ color: "#e53935" }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ubicación</Typography>
                    <Typography>{[usuario.ciudad, usuario.provincia].filter(Boolean).join(", ")}</Typography>
                  </Box>
                </Box>
              )}
              {usuario.fecha_nac && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CakeIcon sx={{ color: "#ab47bc" }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha de nacimiento</Typography>
                    <Typography>{new Date(usuario.fecha_nac).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</Typography>
                  </Box>
                </Box>
              )}
              {usuario.telefono && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <PhoneIcon sx={{ color: "#2e7d32" }} />
                  <Box><Typography variant="caption" color="text.secondary">Teléfono</Typography><Typography>{usuario.telefono}</Typography></Box>
                </Box>
              )}
            </Stack>
            {!usuario.ciudad && !usuario.fecha_nac && !usuario.telefono && !usuario.bio && (
              <Alert severity="info" sx={{ mt: 2 }}>Tu perfil está casi vacío — ve a <strong>Ajustes</strong> para añadir más información.</Alert>
            )}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Estadísticas</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                { label: "Chollos publicados", valor: misDeals.length, color: "#e53935" },
                { label: "Votos recibidos",    valor: misDeals.reduce((s, d) => s + (d.votosPositivos || 0), 0), color: "#ff7043" },
                { label: "Puntos totales",     valor: puntos, color: nivel.color },
              ].map(s => (
                <Paper key={s.label} elevation={1} sx={{ flex: 1, minWidth: 110, p: 2, borderRadius: 3, textAlign: "center" }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.valor}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Paper>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabActual} index={1}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <EmojiEventsIcon sx={{ color: nivel.color, fontSize: 36 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold" fontSize={18}>{nivel.icon} Nivel: {nivel.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {puntos} puntos
                    {sigNivel && ` · Faltan ${sigNivel.min - puntos} para ${sigNivel.icon} ${sigNivel.nombre}`}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={progreso}
                sx={{ height: 10, borderRadius: 5, bgcolor: "#eee", "& .MuiLinearProgress-bar": { bgcolor: nivel.color, borderRadius: 5 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>{progreso}% hacia el siguiente nivel</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>¿Cómo ganar puntos?</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  { accion: "Publicar un chollo",    pts: "+10" },
                  { accion: "Recibir voto positivo", pts: "+1"  },
                  { accion: "Comentar",               pts: "+2"  },
                ].map(r => <Chip key={r.accion} label={`${r.accion} ${r.pts}`} size="small" variant="outlined" sx={{ fontSize: 12 }} />)}
              </Stack>
            </Paper>

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>🏅 Mis badges</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 2, mb: 3 }}>
              {BADGES.map(badge => (
                <Paper key={badge.id} variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: "center", opacity: badge.ganado ? 1 : 0.4, border: badge.ganado ? "1.5px solid #ffa726" : "1px solid #ddd", bgcolor: badge.ganado ? "#fffde7" : "transparent" }}>
                  <Typography fontSize={28}>{badge.icono}</Typography>
                  <Typography fontWeight="bold" fontSize={13} sx={{ mt: 0.5 }}>{badge.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{badge.desc}</Typography>
                  {!badge.ganado && <Chip label="Bloqueado" size="small" sx={{ mt: 1, fontSize: 10 }} />}
                </Paper>
              ))}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                <WhatshotIcon sx={{ fontSize: 20, color: "#e53935", mr: 0.5, verticalAlign: "middle" }} />
                Mis chollos publicados ({misDeals.length})
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate("/publicar")}
                sx={{ bgcolor: "#e53935", color: "white", fontWeight: "bold", "&:hover": { bgcolor: "#c62828" } }}>
                Nuevo chollo
              </Button>
            </Box>

            {cargandoChollos ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress color="error" /></Box>
            ) : misDeals.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                <Typography color="text.secondary" gutterBottom>Todavía no has publicado ningún chollo.</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/publicar")}
                  sx={{ mt: 1, bgcolor: "#e53935", "&:hover": { bgcolor: "#c62828" } }}>
                  Publicar mi primer chollo
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {misDeals.map(c => (
                  <Paper key={c.id} variant="outlined" sx={{ p: 2, borderRadius: 2, "&:hover": { bgcolor: "#fff5f5", borderColor: "#e53935" } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                      <Box onClick={() => navigate(`/chollo/${c.id}`)} sx={{ flex: 1, cursor: "pointer" }}>
                        <Typography fontWeight="bold" fontSize={14}>{c.titulo}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center" flexWrap="wrap">
                          <Typography color="error" fontWeight="bold" fontSize={14}>{c.precioOferta} €</Typography>
                          {c.categoria && <Chip label={c.categoria} size="small" variant="outlined" />}
                          {c.ciudad    && <Chip label={`📍 ${c.ciudad}`} size="small" variant="outlined" />}
                          {c.descuento && <Chip label={c.descuento} size="small" color="success" />}
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={0.5} flexShrink={0}>
                        <Tooltip title="Editar chollo" arrow>
                          <IconButton size="small" onClick={() => navigate(`/editar/${c.id}`)}
                            sx={{ bgcolor: "#fff3e0", color: "#ff7043", "&:hover": { bgcolor: "#ffe0b2" } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar chollo" arrow>
                          <IconButton size="small" onClick={() => confirmarEliminar(c)}
                            sx={{ bgcolor: "#fce4ec", color: "#e53935", "&:hover": { bgcolor: "#f8bbd0" } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}

            
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>❤️ Categorías favoritas</Typography>
            {cargandoChollos ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress color="error" size={24} /></Box>
            ) : categoriasFavoritas.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                <Typography color="text.secondary">
                  Publica chollos para ver tus categorías favoritas.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {categoriasFavoritas.map(cat => {
                  const maxInt = categoriasFavoritas[0].interacciones;
                  const pct    = Math.round((cat.interacciones / maxInt) * 100);
                  return (
                    <Box key={cat.nombre}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">{cat.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cat.interacciones} {cat.interacciones === 1 ? "chollo" : "chollos"}
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 8, borderRadius: 5, bgcolor: cat.color + "22", "& .MuiLinearProgress-bar": { bgcolor: cat.color, borderRadius: 5 } }} />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={tabActual} index={2}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>⚙️ Editar información</Typography>
            {errorForm && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorForm("")}>{errorForm}</Alert>}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Color del avatar</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {COLORES_AVATAR.map((color, index) => (
                <Tooltip key={index} title={color.label} arrow>
                  <Box onClick={() => setTColorAvatar(index)} sx={{ width: 36, height: 36, borderRadius: "50%", background: color.bg, cursor: "pointer", border: tColorAvatar === index ? "3px solid #222" : "3px solid transparent", transition: "border 0.15s", "&:hover": { opacity: 0.8 } }} />
                </Tooltip>
              ))}
            </Stack>
            <Avatar sx={{ width: 60, height: 60, fontSize: 26, background: COLORES_AVATAR[tColorAvatar].bg, mb: 3 }}>
              {(tNombre || inicial).charAt(0).toUpperCase()}
            </Avatar>

            <Divider sx={{ mb: 3 }} />
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>INFORMACIÓN BÁSICA</Typography>
              <TextField label="Nombre completo" value={tNombre} onChange={e => setTNombre(e.target.value)} fullWidth required
                error={!tNombre.trim()} helperText={!tNombre.trim() ? "Campo obligatorio" : ""} />
              <TextField label="Alias (nombre de usuario)" value={tAlias} onChange={e => setTAlias(e.target.value)} fullWidth
                placeholder="Ej: cazachollos99" inputProps={{ maxLength: 30 }} helperText={`${tAlias.length}/30`} />
              <TextField label="Biografía" value={tBio} onChange={e => setTBio(e.target.value)} fullWidth multiline rows={3}
                placeholder="Cuéntanos algo sobre ti..." inputProps={{ maxLength: 160 }} helperText={`${tBio.length}/160`} />
              <Divider />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>DATOS PERSONALES</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Ciudad" value={tCiudad} onChange={e => setTCiudad(e.target.value)} fullWidth placeholder="Ej: Sevilla" />
                <FormControl fullWidth>
                  <InputLabel>Provincia</InputLabel>
                  <Select value={tProvincia} label="Provincia" onChange={e => setTProvincia(e.target.value)}
                    renderValue={(v) => v || "Seleccionar"} MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}>
                    <MenuItem value=""><em>Seleccionar</em></MenuItem>
                    {PROVINCIAS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <TextField label="Fecha de nacimiento" type="date" value={tFechaNac} onChange={e => setTFechaNac(e.target.value)}
                fullWidth InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split("T")[0] }} />
              <TextField label="Teléfono de contacto" value={tTelefono} onChange={e => setTTelefono(e.target.value)}
                fullWidth placeholder="Ej: +34 612 345 678" helperText="Solo visible para ti" />
              <Divider />
              <TextField label="Correo electrónico" value={usuario.email} fullWidth disabled helperText="El correo no se puede cambiar desde aquí" />
            </Stack>

            <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarCambios}
              disabled={!tNombre.trim() || cargandoPerfil} fullWidth size="large"
              sx={{ mt: 4, fontWeight: "bold", background: "linear-gradient(90deg, #e53935, #ff7043)", "&:hover": { background: "linear-gradient(90deg, #c62828, #e64a19)" }, "&:disabled": { opacity: 0.5 } }}>
              {cargandoPerfil ? "Guardando..." : "Guardar cambios"}
            </Button>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog open={!!dealAEliminar} onClose={() => setDealAEliminar(null)}>
        <DialogTitle sx={{ fontWeight: "bold" }}>¿Eliminar este chollo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a eliminar <strong>"{dealAEliminar?.titulo}"</strong>. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDealAEliminar(null)} variant="outlined">Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={ejecutarEliminar}>Sí, eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
