// 📄 PublicarChollo.jsx
// handleSubmit ahora guarda el chollo en la BD vía API.
// Se mantienen los exports leerDeals / eliminarDeal / estaExpirado
// por compatibilidad, pero los datos reales vienen de la API.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Paper, Typography, TextField,
  Button, Grid, MenuItem, Select, InputLabel,
  FormControl, Alert, Divider, InputAdornment, Chip, Stack,
} from "@mui/material";
import LocalOfferIcon        from "@mui/icons-material/LocalOffer";
import StoreIcon             from "@mui/icons-material/Store";
import LinkIcon              from "@mui/icons-material/Link";
import SendIcon              from "@mui/icons-material/Send";
import AccessTimeIcon        from "@mui/icons-material/AccessTime";
import EuroIcon              from "@mui/icons-material/Euro";
import ImageIcon             from "@mui/icons-material/Image";
import { useAuth }           from "../context/AuthContext";
import api                   from "../api/client";

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS = ["Electrónica","Moda","Hogar","Alimentación","Deportes","Viajes","Servicios","Otros"];

const PROVINCIAS = [
  "Álava","Albacete","Alicante","Almería","Asturias","Ávila",
  "Badajoz","Barcelona","Burgos","Cáceres","Cádiz","Cantabria",
  "Castellón","Ciudad Real","Córdoba","Cuenca","Gerona","Granada",
  "Guadalajara","Guipúzcoa","Huelva","Huesca","Islas Baleares",
  "Jaén","La Coruña","La Rioja","Las Palmas","León","Lérida",
  "Lugo","Madrid","Málaga","Murcia","Navarra","Orense",
  "Palencia","Pontevedra","Salamanca","Santa Cruz de Tenerife",
  "Segovia","Sevilla","Soria","Tarragona","Teruel",
  "Toledo","Valencia","Valladolid","Vizcaya","Zamora","Zaragoza",
];

// ── Helpers exportados (compatibilidad con otros componentes) ──────────────────

/** @deprecated Los datos ahora vienen de la API, no de localStorage */
export const leerDeals = () => {
  try {
    const raw = localStorage.getItem("chollopoint_deals");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

/** @deprecated Usa api.chollos.eliminar(id) directamente */
export const eliminarDeal = (id) => {
  const actuales = leerDeals();
  const filtrados = actuales.filter((d) => String(d.id) !== String(id));
  localStorage.setItem("chollopoint_deals", JSON.stringify(filtrados));
};

/**
 * Comprueba si un chollo está expirado.
 * Soporta tanto datos de la API (expiraEn) como datos legacy de localStorage (creadoEn).
 */
export const estaExpirado = (deal) => {
  if (deal.expiraEn)  return Date.now() > deal.expiraEn;
  if (deal.creadoEn)  return Date.now() - deal.creadoEn > 24 * 60 * 60 * 1000;
  return false;
};

// ── Sub-componente: cabecera de sección ───────────────────────────────────────

function SeccionHeader({ icon, titulo, subtitulo }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, mt: 1 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 2,
        bgcolor: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#e53935", flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography fontWeight="bold" fontSize={15}>{titulo}</Typography>
        {subtitulo && (
          <Typography variant="caption" color="text.secondary">{subtitulo}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PublicarChollo() {
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const [form, setForm] = useState({
    titulo: "", descripcion: "", precioOriginal: "", precioOferta: "",
    tienda: "", enlace: "", imagen: "", categoria: "", ciudad: "",
  });
  const [enviado,  setEnviado]  = useState(false);
  const [errores,  setErrores]  = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  const cambiar = (campo) => (e) =>
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const descuento = form.precioOriginal && form.precioOferta
    ? Math.round(
        ((parseFloat(form.precioOriginal) - parseFloat(form.precioOferta)) /
          parseFloat(form.precioOriginal)) * 100
      )
    : null;

  const validar = () => {
    const e = {};
    if (!form.titulo.trim())   e.titulo         = "El título es obligatorio";
    if (!form.precioOriginal)  e.precioOriginal  = "Precio original obligatorio";
    if (!form.precioOferta)    e.precioOferta    = "Precio oferta obligatorio";
    if (!form.tienda.trim())   e.tienda          = "Nombre de tienda obligatorio";
    if (!form.categoria)       e.categoria       = "Selecciona una categoría";
    if (!form.ciudad)          e.ciudad          = "Selecciona una provincia";
    if (form.precioOferta && form.precioOriginal &&
        parseFloat(form.precioOferta) >= parseFloat(form.precioOriginal))
      e.precioOferta = "El precio oferta debe ser menor al original";
    return e;
  };

  const handleSubmit = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }

    setCargando(true);
    setErrorApi("");

    try {
      await api.chollos.crear({
        titulo:          form.titulo.trim(),
        descripcion:     form.descripcion.trim(),
        precio_original: parseFloat(form.precioOriginal),
        precio_oferta:   parseFloat(form.precioOferta),
        tienda:          form.tienda.trim(),
        enlace:          form.enlace.trim() || "",
        imagen:          form.imagen.trim() ||
          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
        categoria:       form.categoria,
        ciudad:          form.ciudad,
        comunidad:       form.ciudad,
        publicado_por:   usuario?.nombre || "Anónimo",
      });

      setEnviado(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setErrorApi(err.message || "Error al publicar el chollo");
    } finally {
      setCargando(false);
    }
  };

  // ── Pantalla sin sesión ──
  if (!usuario) {
    return (
      <Box sx={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
        <Paper sx={{ p:5, textAlign:"center", borderRadius:4, maxWidth:400 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Inicia sesión para publicar
          </Typography>
          <Typography color="text.secondary" sx={{ mb:3 }}>
            Solo los usuarios registrados pueden publicar chollos.
          </Typography>
          <Button variant="contained" color="error" onClick={() => navigate("/login")}>
            Ir al login
          </Button>
        </Paper>
      </Box>
    );
  }

  // ── Pantalla de éxito ──
  if (enviado) {
    return (
      <Box sx={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
        <Paper sx={{ p:5, textAlign:"center", borderRadius:4, maxWidth:400 }}>
          <Typography variant="h4" gutterBottom>🎉 ¡Chollo publicado!</Typography>
          <Typography color="text.secondary">
            Tu chollo ya está visible. Caduca en <strong>24 horas</strong>.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt:1 }}>
            Redirigiendo al inicio...
          </Typography>
        </Paper>
      </Box>
    );
  }

  const imagenPreview = form.imagen.trim() ||
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600";

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🔥 Publicar un chollo
        </Typography>
        <Alert severity="info" icon={<AccessTimeIcon />} sx={{ maxWidth: 600 }}>
          Los chollos se marcan como <strong>expirados</strong> automáticamente
          pasadas <strong>24 horas</strong> desde su publicación.
        </Alert>
      </Box>

      {errorApi && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorApi("")}>
          {errorApi}
        </Alert>
      )}

      <Grid container spacing={3} alignItems="flex-start">

        {/* ── COLUMNA IZQUIERDA: formulario ── */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<LocalOfferIcon fontSize="small" />}
                titulo="Información del chollo"
                subtitulo="Título, descripción y categoría"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Título del chollo *"
                  value={form.titulo}
                  onChange={cambiar("titulo")}
                  error={!!errores.titulo}
                  helperText={errores.titulo || `${form.titulo.length}/100 caracteres`}
                  inputProps={{ maxLength: 100 }}
                  placeholder='Ej: TV Samsung 55" 4K QLED a mitad de precio'
                />

                <TextField
                  fullWidth multiline rows={3}
                  label="Descripción (opcional)"
                  value={form.descripcion}
                  onChange={cambiar("descripcion")}
                  placeholder="Detalles del chollo: condiciones, modelo exacto, cómo conseguirlo..."
                  inputProps={{ maxLength: 400 }}
                  helperText={`${form.descripcion.length}/400 caracteres`}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth error={!!errores.categoria}>
                    <InputLabel>Categoría *</InputLabel>
                    <Select value={form.categoria} onChange={cambiar("categoria")}
                      label="Categoría *" renderValue={(v) => v}>
                      {CATEGORIAS.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                    {errores.categoria && (
                      <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                        {errores.categoria}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={!!errores.ciudad}>
                    <InputLabel>Provincia *</InputLabel>
                    <Select value={form.ciudad} onChange={cambiar("ciudad")}
                      label="Provincia *" renderValue={(v) => v}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}>
                      {PROVINCIAS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                    {errores.ciudad && (
                      <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                        {errores.ciudad}
                      </Typography>
                    )}
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<EuroIcon fontSize="small" />}
                titulo="Precios"
                subtitulo="El descuento se calcula automáticamente"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth label="Precio original *"
                  type="number" inputProps={{ min: 0, step: 0.01 }}
                  value={form.precioOriginal}
                  onChange={cambiar("precioOriginal")}
                  error={!!errores.precioOriginal}
                  helperText={errores.precioOriginal || "Precio sin oferta"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth label="Precio oferta *"
                  type="number" inputProps={{ min: 0, step: 0.01 }}
                  value={form.precioOferta}
                  onChange={cambiar("precioOferta")}
                  error={!!errores.precioOferta}
                  helperText={errores.precioOferta || "Precio con el descuento aplicado"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon fontSize="small" sx={{ color: "#e53935" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              {descuento !== null && descuento > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<LocalOfferIcon />}
                    label={`¡Descuento calculado: -${descuento}%!`}
                    color="success"
                    sx={{ fontWeight: "bold", fontSize: 14, height: 32 }}
                  />
                </Box>
              )}
              {descuento !== null && descuento <= 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  El precio de oferta debe ser menor al precio original.
                </Alert>
              )}
            </Paper>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<StoreIcon fontSize="small" />}
                titulo="Tienda e imagen"
                subtitulo="¿Dónde se puede conseguir? Añade un enlace y una foto"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth label="Tienda *"
                    value={form.tienda}
                    onChange={cambiar("tienda")}
                    error={!!errores.tienda}
                    helperText={errores.tienda || "Amazon, MediaMarkt, Lidl..."}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <StoreIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth label="Enlace a la oferta"
                    value={form.enlace}
                    onChange={cambiar("enlace")}
                    placeholder="https://..."
                    helperText="Opcional — URL directa a la oferta"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <TextField
                  fullWidth label="URL de imagen (opcional)"
                  value={form.imagen}
                  onChange={cambiar("imagen")}
                  placeholder="https://... (si no pones ninguna usamos una genérica)"
                  helperText="El preview se actualiza en tiempo real en el panel derecho →"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ImageIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Paper>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={cargando}
                sx={{ fontWeight: "bold", px: 5, borderRadius: 3 }}
              >
                {cargando ? "Publicando..." : "Publicar chollo"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/")}
                sx={{ borderRadius: 3 }}
              >
                Cancelar
              </Button>
            </Box>

          </Stack>
        </Grid>

        {/* ── COLUMNA DERECHA: preview del chollo ── */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box
                component="img"
                src={imagenPreview}
                alt="preview"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600";
                }}
                sx={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
              />

              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {form.categoria && (
                    <Chip icon={<LocalOfferIcon />} label={form.categoria}
                      size="small" color="error" variant="outlined" />
                  )}
                  {form.ciudad && (
                    <Chip label={`📍 ${form.ciudad}`} size="small" variant="outlined" />
                  )}
                  {descuento !== null && descuento > 0 && (
                    <Chip label={`-${descuento}%`} size="small" color="success"
                      sx={{ fontWeight: "bold" }} />
                  )}
                </Stack>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {form.titulo || <span style={{ color: "#bbb" }}>Título del chollo</span>}
                </Typography>

                {form.descripcion ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {form.descripcion}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
                    Aquí aparecerá la descripción...
                  </Typography>
                )}

                <Divider sx={{ mb: 2 }} />

                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {form.precioOferta ? `${parseFloat(form.precioOferta).toFixed(2)} €` : "— €"}
                  </Typography>
                  {form.precioOriginal && (
                    <Typography variant="body1"
                      sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                      {parseFloat(form.precioOriginal).toFixed(2)} €
                    </Typography>
                  )}
                </Stack>

                {form.tienda && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <StoreIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">{form.tienda}</Typography>
                  </Stack>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                  Publicado por <strong>{usuario.nombre}</strong>
                </Typography>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <AccessTimeIcon sx={{ color: "#ff7043", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary">
                Este chollo expirará automáticamente <strong>24 horas</strong> después de publicarse.
              </Typography>
            </Paper>
          </Box>
        </Grid>

      </Grid>
    </Container>
  );
}