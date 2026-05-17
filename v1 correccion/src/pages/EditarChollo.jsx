import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Container, Paper, Typography, TextField,
  Button, Grid, MenuItem, Select, InputLabel,
  FormControl, Alert, Divider, InputAdornment, Chip, Stack,
  CircularProgress,
} from "@mui/material";
import LocalOfferIcon  from "@mui/icons-material/LocalOffer";
import StoreIcon       from "@mui/icons-material/Store";
import LinkIcon        from "@mui/icons-material/Link";
import SaveIcon        from "@mui/icons-material/Save";
import EuroIcon        from "@mui/icons-material/Euro";
import ImageIcon       from "@mui/icons-material/Image";
import ArrowBackIcon   from "@mui/icons-material/ArrowBack";
import { useAuth }     from "../context/AuthContext";
import api             from "../api/client";
import { normalizeChollo } from "../api/utils";

const CATEGORIAS = ["Electrónica", "Moda", "Hogar", "Alimentación", "Deportes", "Viajes", "Servicios", "Otros"];

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

function SeccionHeader({ icon, titulo, subtitulo }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, mt: 1 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#e53935", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography fontWeight="bold" fontSize={15}>{titulo}</Typography>
        {subtitulo && <Typography variant="caption" color="text.secondary">{subtitulo}</Typography>}
      </Box>
    </Box>
  );
}

export default function EditarChollo() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorCarga,      setErrorCarga]      = useState("");
  const [form, setForm] = useState({
    titulo: "", descripcion: "", precioOriginal: "", precioOferta: "",
    tienda: "", enlace: "", imagen: "", categoria: "", ciudad: "",
  });
  const [guardado,  setGuardado]  = useState(false);
  const [errores,   setErrores]   = useState({});
  const [cargando,  setCargando]  = useState(false);
  const [errorApi,  setErrorApi]  = useState("");

  useEffect(() => {
    async function cargarChollo() {
      setCargandoInicial(true);
      try {
        const res = await api.chollos.ver(id);
        const c   = normalizeChollo(res.data.chollo);
        // ── MODIFICADO: admin puede editar cualquier chollo ──
        if (usuario && c.usuarioId !== usuario.id && usuario.rol !== "admin") {
          setErrorCarga("No tienes permiso para editar este chollo.");
          setCargandoInicial(false);
          return;
        }
        setForm({
          titulo:         c.titulo         || "",
          descripcion:    c.descripcion    || "",
          precioOriginal: c.precioOriginal != null ? String(c.precioOriginal) : "",
          precioOferta:   c.precioOferta   != null ? String(c.precioOferta)   : "",
          tienda:         c.tienda         || "",
          enlace:         c.enlace         || "",
          imagen:         c.imagen         || "",
          categoria:      c.categoria      || "",
          ciudad:         c.ciudad         || "",
        });
      } catch {
        setErrorCarga("No se pudo cargar el chollo. Comprueba la conexión con el servidor.");
      }
      setCargandoInicial(false);
    }
    cargarChollo();
  }, [id, usuario]);

  function cambiar(campo) {
    return (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  let descuento = null;
  if (form.precioOriginal && form.precioOferta) {
    descuento = Math.round(((parseFloat(form.precioOriginal) - parseFloat(form.precioOferta)) / parseFloat(form.precioOriginal)) * 100);
  }

  function validar() {
    const e = {};
    if (!form.titulo.trim())   e.titulo        = "El título es obligatorio";
    if (!form.precioOriginal)  e.precioOriginal = "Precio original obligatorio";
    if (!form.precioOferta)    e.precioOferta   = "Precio oferta obligatorio";
    if (!form.tienda.trim())   e.tienda         = "Nombre de tienda obligatorio";
    if (!form.categoria)       e.categoria      = "Selecciona una categoría";
    if (!form.ciudad)          e.ciudad         = "Selecciona una provincia";
    if (form.precioOferta && form.precioOriginal && parseFloat(form.precioOferta) >= parseFloat(form.precioOriginal))
      e.precioOferta = "El precio oferta debe ser menor al original";
    return e;
  }

  async function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setCargando(true);
    setErrorApi("");
    try {
      await api.chollos.editar(id, {
        titulo:          form.titulo.trim(),
        descripcion:     form.descripcion.trim(),
        precio_original: parseFloat(form.precioOriginal),
        precio_oferta:   parseFloat(form.precioOferta),
        tienda:          form.tienda.trim(),
        enlace:          form.enlace.trim() || "",
        imagen:          form.imagen.trim() || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
        categoria:       form.categoria,
        ciudad:          form.ciudad,
        comunidad:       form.ciudad,
      });
      setGuardado(true);
      setTimeout(() => navigate(`/chollo/${id}`), 1500);
    } catch (err) {
      setErrorApi(err.message || "Error al guardar los cambios");
    }
    setCargando(false);
  }

  if (!usuario) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 400 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">Inicia sesión para editar</Typography>
          <Button variant="contained" color="error" onClick={() => navigate("/login")}>Ir al login</Button>
        </Paper>
      </Box>
    );
  }

  if (cargandoInicial) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (errorCarga) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 450 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="error">Error</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{errorCarga}</Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Volver</Button>
        </Paper>
      </Box>
    );
  }

  if (guardado) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 400 }}>
          <Typography variant="h4" gutterBottom>✅ ¡Chollo actualizado!</Typography>
          <Typography color="text.secondary">Los cambios se han guardado correctamente.</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Redirigiendo al chollo...</Typography>
        </Paper>
      </Box>
    );
  }

  const imagenPreview = form.imagen.trim() || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600";

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/chollo/${id}`)} sx={{ borderRadius: 2 }}>
          Volver al chollo
        </Button>
        <Typography variant="h4" fontWeight="bold">✏️ Editar chollo</Typography>
        {/* Badge visual para que el admin sepa que está en modo admin */}
        {usuario.rol === "admin" && (
          <Chip label="Modo Admin" color="error" size="small" sx={{ fontWeight: "bold" }} />
        )}
      </Box>

      {errorApi && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorApi("")}>{errorApi}</Alert>}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader icon={<LocalOfferIcon fontSize="small" />} titulo="Información del chollo" subtitulo="Título, descripción y categoría" />
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2.5}>
                <TextField fullWidth label="Título del chollo *" value={form.titulo} onChange={cambiar("titulo")}
                  error={!!errores.titulo} helperText={errores.titulo || `${form.titulo.length}/100 caracteres`} inputProps={{ maxLength: 100 }} />
                <TextField fullWidth multiline rows={3} label="Descripción (opcional)" value={form.descripcion}
                  onChange={cambiar("descripcion")} placeholder="Detalles del chollo: condiciones, modelo exacto, cómo conseguirlo..."
                  inputProps={{ maxLength: 400 }} helperText={`${form.descripcion.length}/400 caracteres`} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth error={!!errores.categoria}>
                    <InputLabel>Categoría *</InputLabel>
                    <Select value={form.categoria} onChange={cambiar("categoria")} label="Categoría *" renderValue={(v) => v}>
                      {CATEGORIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                    {errores.categoria && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{errores.categoria}</Typography>}
                  </FormControl>
                  <FormControl fullWidth error={!!errores.ciudad}>
                    <InputLabel>Provincia *</InputLabel>
                    <Select value={form.ciudad} onChange={cambiar("ciudad")} label="Provincia *" renderValue={(v) => v}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}>
                      {PROVINCIAS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                    {errores.ciudad && <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>{errores.ciudad}</Typography>}
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader icon={<EuroIcon fontSize="small" />} titulo="Precios" subtitulo="El descuento se recalcula automáticamente" />
              <Divider sx={{ mb: 2.5 }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField fullWidth label="Precio original *" type="number" inputProps={{ min: 0, step: 0.01 }}
                  value={form.precioOriginal} onChange={cambiar("precioOriginal")}
                  error={!!errores.precioOriginal} helperText={errores.precioOriginal || "Precio sin oferta"}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EuroIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment> }} />
                <TextField fullWidth label="Precio oferta *" type="number" inputProps={{ min: 0, step: 0.01 }}
                  value={form.precioOferta} onChange={cambiar("precioOferta")}
                  error={!!errores.precioOferta} helperText={errores.precioOferta || "Precio con el descuento aplicado"}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EuroIcon fontSize="small" sx={{ color: "#e53935" }} /></InputAdornment> }} />
              </Stack>
              {descuento !== null && descuento > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Chip icon={<LocalOfferIcon />} label={`Descuento calculado: -${descuento}%`} color="success" sx={{ fontWeight: "bold", fontSize: 14, height: 32 }} />
                </Box>
              )}
              {descuento !== null && descuento <= 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>El precio de oferta debe ser menor al precio original.</Alert>
              )}
            </Paper>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader icon={<StoreIcon fontSize="small" />} titulo="Tienda e imagen" subtitulo="Enlace directo a la oferta y foto del producto" />
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField fullWidth label="Tienda *" value={form.tienda} onChange={cambiar("tienda")}
                    error={!!errores.tienda} helperText={errores.tienda || "Amazon, MediaMarkt, Lidl..."}
                    InputProps={{ startAdornment: <InputAdornment position="start"><StoreIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment> }} />
                  <TextField fullWidth label="Enlace a la oferta" value={form.enlace} onChange={cambiar("enlace")}
                    placeholder="https://..." helperText="URL directa a la oferta"
                    InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment> }} />
                </Stack>
                <TextField fullWidth label="URL de imagen (opcional)" value={form.imagen} onChange={cambiar("imagen")}
                  placeholder="https://... (si no pones ninguna usamos una genérica)"
                  helperText="El preview se actualiza en tiempo real en el panel derecho →"
                  InputProps={{ startAdornment: <InputAdornment position="start"><ImageIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment> }} />
              </Stack>
            </Paper>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="contained" color="error" size="large" startIcon={<SaveIcon />}
                onClick={handleSubmit} disabled={cargando} sx={{ fontWeight: "bold", px: 5, borderRadius: 3 }}>
                {cargando ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button variant="outlined" size="large" startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/chollo/${id}`)} sx={{ borderRadius: 3 }}>
                Cancelar
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box component="img" src={imagenPreview} alt="preview"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600"; }}
                sx={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {form.categoria && <Chip icon={<LocalOfferIcon />} label={form.categoria} size="small" color="error" variant="outlined" />}
                  {form.ciudad && <Chip label={`📍 ${form.ciudad}`} size="small" variant="outlined" />}
                  {descuento !== null && descuento > 0 && <Chip label={`-${descuento}%`} size="small" color="success" sx={{ fontWeight: "bold" }} />}
                </Stack>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {form.titulo || <span style={{ color: "#bbb" }}>Título del chollo</span>}
                </Typography>
                {form.descripcion
                  ? <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{form.descripcion}</Typography>
                  : <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>Aquí aparecerá la descripción...</Typography>
                }
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {form.precioOferta ? `${parseFloat(form.precioOferta).toFixed(2)} €` : "— €"}
                  </Typography>
                  {form.precioOriginal && (
                    <Typography variant="body1" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
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
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "#fff8e1" }}>
              <Typography variant="caption" color="text.secondary">
                ⚠️ Al editar, el tiempo de expiración del chollo <strong>no se reinicia</strong>. El chollo seguirá expirando en la misma fecha original.
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
