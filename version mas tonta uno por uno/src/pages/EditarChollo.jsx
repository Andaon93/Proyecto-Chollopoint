// 📄 EditarChollo.jsx
// Página para editar un chollo existente.
// Carga los datos actuales desde la API, permite modificarlos
// y los guarda con PUT /chollos/{id}.
// Solo accesible por el autor del chollo.

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Container, Paper, Typography, TextField,
  Button, Grid, MenuItem, Select, InputLabel,
  FormControl, Alert, Divider, InputAdornment, Chip, Stack,
  CircularProgress,
} from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon      from "@mui/icons-material/Store";
import LinkIcon       from "@mui/icons-material/Link";
import SaveIcon       from "@mui/icons-material/Save";
import EuroIcon       from "@mui/icons-material/Euro";
import ImageIcon      from "@mui/icons-material/Image";
import ArrowBackIcon  from "@mui/icons-material/ArrowBack";

import { useAuth }          from "../context/AuthContext";
import api                  from "../api/client";
import { normalizeChollo }  from "../api/utils";

// Categorías disponibles para clasificar el chollo
const CATEGORIAS = [
  "Electrónica", "Moda", "Hogar", "Alimentación",
  "Deportes", "Viajes", "Servicios", "Otros",
];

// Lista de provincias españolas
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

// Imagen por defecto si el usuario no pone ninguna
const IMAGEN_POR_DEFECTO = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600";

/**
 * Cabecera visual para cada sección del formulario
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icono de la sección
 * @param {string} props.titulo - Título de la sección
 * @param {string} props.subtitulo - Texto secundario opcional
 */
function SeccionHeader({ icon, titulo, subtitulo }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, mt: 1 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 2,
        bgcolor: "#fce4ec", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#e53935", flexShrink: 0,
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

// ─── Componente principal ─────────────────────────────────────────────────────
function EditarChollo() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { usuario } = useAuth();

  // Estado de la carga inicial del chollo
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorCarga,      setErrorCarga]      = useState("");

  // Datos del formulario
  const [formulario, setFormulario] = useState({
    titulo:         "",
    descripcion:    "",
    precioOriginal: "",
    precioOferta:   "",
    tienda:         "",
    enlace:         "",
    imagen:         "",
    categoria:      "",
    ciudad:         "",
  });

  // Estado de la operación de guardado
  const [guardado,     setGuardado]     = useState(false);
  const [errores,      setErrores]      = useState({});
  const [guardando,    setGuardando]    = useState(false);
  const [errorServidor, setErrorServidor] = useState("");

  /**
   * Carga los datos actuales del chollo al entrar en la página
   */
  useEffect(() => {
    async function fetchChollo() {
      try {
        const respuesta = await api.chollos.ver(id);
        const c = normalizeChollo(respuesta.data.chollo);

        // Verificar que el usuario logueado es el autor del chollo
        if (usuario && c.usuarioId !== usuario.id) {
          setErrorCarga("No tienes permiso para editar este chollo.");
          return;
        }

        // Rellenar el formulario con los datos del chollo
        setFormulario({
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

      } catch (error) {
        setErrorCarga("No se pudo cargar el chollo. Comprueba la conexión con el servidor.");
        console.error("Error al cargar el chollo:", error);
      }

      setCargandoInicial(false);
    }

    fetchChollo();
  }, [id, usuario]);

  /**
   * Actualiza un campo del formulario cuando el usuario escribe
   * @param {string} campo - Nombre del campo a actualizar
   * @param {React.ChangeEvent} e - Evento del input
   */
  function handleChange(campo, e) {
    setFormulario(prev => ({ ...prev, [campo]: e.target.value }));
  }

  /**
   * Valida los campos obligatorios antes de enviar
   * @returns {Object} Objeto con los errores encontrados
   */
  function validarFormulario() {
    const erroresEncontrados = {};

    if (!formulario.titulo.trim())   erroresEncontrados.titulo         = "El título es obligatorio";
    if (!formulario.precioOriginal)  erroresEncontrados.precioOriginal  = "Precio original obligatorio";
    if (!formulario.precioOferta)    erroresEncontrados.precioOferta    = "Precio oferta obligatorio";
    if (!formulario.tienda.trim())   erroresEncontrados.tienda          = "Nombre de tienda obligatorio";
    if (!formulario.categoria)       erroresEncontrados.categoria       = "Selecciona una categoría";
    if (!formulario.ciudad)          erroresEncontrados.ciudad          = "Selecciona una provincia";

    // El precio de oferta tiene que ser menor al original
    if (
      formulario.precioOferta && formulario.precioOriginal &&
      parseFloat(formulario.precioOferta) >= parseFloat(formulario.precioOriginal)
    ) {
      erroresEncontrados.precioOferta = "El precio oferta debe ser menor al original";
    }

    return erroresEncontrados;
  }

  /**
   * Calcula el porcentaje de descuento en tiempo real
   * Devuelve null si los precios no son válidos
   */
  function calcularDescuento() {
    if (!formulario.precioOriginal || !formulario.precioOferta) return null;
    return Math.round(
      ((parseFloat(formulario.precioOriginal) - parseFloat(formulario.precioOferta)) /
        parseFloat(formulario.precioOriginal)) * 100
    );
  }

  /**
   * Envía los cambios al servidor si el formulario es válido
   */
  async function guardarCambios() {
    const erroresEncontrados = validarFormulario();
    if (Object.keys(erroresEncontrados).length > 0) {
      setErrores(erroresEncontrados);
      return;
    }

    setGuardando(true);
    setErrorServidor("");

    try {
      // Enviamos los datos con los nombres que espera el backend (snake_case)
      await api.chollos.editar(id, {
        titulo:          formulario.titulo.trim(),
        descripcion:     formulario.descripcion.trim(),
        precio_original: parseFloat(formulario.precioOriginal),
        precio_oferta:   parseFloat(formulario.precioOferta),
        tienda:          formulario.tienda.trim(),
        enlace:          formulario.enlace.trim() || "",
        imagen:          formulario.imagen.trim() || IMAGEN_POR_DEFECTO,
        categoria:       formulario.categoria,
        ciudad:          formulario.ciudad,
        comunidad:       formulario.ciudad,
      });

      // Mostrar pantalla de éxito y redirigir al chollo
      setGuardado(true);
      setTimeout(() => navigate(`/chollo/${id}`), 1500);

    } catch (error) {
      setErrorServidor(error.mensaje || error.message || "Error al guardar los cambios");
    }

    setGuardando(false);
  }

  // Mostrar aviso si no hay sesión iniciada
  if (!usuario) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 400 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Inicia sesión para editar
          </Typography>
          <Button variant="contained" color="error" onClick={() => navigate("/login")}>
            Ir al login
          </Button>
        </Paper>
      </Box>
    );
  }

  // Mostrar spinner mientras se cargan los datos
  if (cargandoInicial) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  // Mostrar error si no se pudo cargar o no tiene permisos
  if (errorCarga) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 450 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="error">
            Error
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{errorCarga}</Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Paper>
      </Box>
    );
  }

  // Mostrar pantalla de confirmación cuando se guarda correctamente
  if (guardado) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 400 }}>
          <Typography variant="h4" gutterBottom>✅ ¡Chollo actualizado!</Typography>
          <Typography color="text.secondary">
            Los cambios se han guardado correctamente.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Redirigiendo al chollo...
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Descuento calculado para mostrar en el preview y en el campo de precios
  const descuento = calcularDescuento();

  // Imagen del preview: la que escriba el usuario o la genérica
  const imagenPreview = formulario.imagen.trim() || IMAGEN_POR_DEFECTO;

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>

      {/* Cabecera de la página */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/chollo/${id}`)}
          sx={{ borderRadius: 2 }}
        >
          Volver al chollo
        </Button>
        <Typography variant="h4" fontWeight="bold">
          ✏️ Editar chollo
        </Typography>
      </Box>

      {/* Mensaje de error del servidor */}
      {errorServidor && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorServidor("")}>
          {errorServidor}
        </Alert>
      )}

      <Grid container spacing={3} alignItems="flex-start">

        {/* Columna izquierda: formulario */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={2.5}>

            {/* Sección: información general */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<LocalOfferIcon fontSize="small" />}
                titulo="Información del chollo"
                subtitulo="Título, descripción y categoría"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2.5}>
                {/* Campo de título */}
                <TextField
                  fullWidth
                  label="Título del chollo *"
                  value={formulario.titulo}
                  onChange={e => handleChange("titulo", e)}
                  error={!!errores.titulo}
                  helperText={errores.titulo || `${formulario.titulo.length}/100 caracteres`}
                  inputProps={{ maxLength: 100 }}
                />

                {/* Campo de descripción */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción (opcional)"
                  value={formulario.descripcion}
                  onChange={e => handleChange("descripcion", e)}
                  placeholder="Detalles del chollo: condiciones, modelo exacto, cómo conseguirlo..."
                  inputProps={{ maxLength: 400 }}
                  helperText={`${formulario.descripcion.length}/400 caracteres`}
                />

                {/* Categoría y provincia */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth error={!!errores.categoria}>
                    <InputLabel>Categoría *</InputLabel>
                    <Select
                      value={formulario.categoria}
                      onChange={e => handleChange("categoria", e)}
                      label="Categoría *"
                      renderValue={v => v}
                    >
                      {CATEGORIAS.map(c => (
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
                    <Select
                      value={formulario.ciudad}
                      onChange={e => handleChange("ciudad", e)}
                      label="Provincia *"
                      renderValue={v => v}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                    >
                      {PROVINCIAS.map(p => (
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

            {/* Sección: precios */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<EuroIcon fontSize="small" />}
                titulo="Precios"
                subtitulo="El descuento se recalcula automáticamente"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {/* Precio original */}
                <TextField
                  fullWidth
                  label="Precio original *"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formulario.precioOriginal}
                  onChange={e => handleChange("precioOriginal", e)}
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

                {/* Precio con oferta */}
                <TextField
                  fullWidth
                  label="Precio oferta *"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formulario.precioOferta}
                  onChange={e => handleChange("precioOferta", e)}
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

              {/* Mostrar el descuento calculado si es positivo */}
              {descuento !== null && descuento > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<LocalOfferIcon />}
                    label={`Descuento calculado: -${descuento}%`}
                    color="success"
                    sx={{ fontWeight: "bold", fontSize: 14, height: 32 }}
                  />
                </Box>
              )}

              {/* Aviso si el precio de oferta es mayor o igual al original */}
              {descuento !== null && descuento <= 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  El precio de oferta debe ser menor al precio original.
                </Alert>
              )}
            </Paper>

            {/* Sección: tienda e imagen */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <SeccionHeader
                icon={<StoreIcon fontSize="small" />}
                titulo="Tienda e imagen"
                subtitulo="Enlace directo a la oferta y foto del producto"
              />
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  {/* Nombre de la tienda */}
                  <TextField
                    fullWidth
                    label="Tienda *"
                    value={formulario.tienda}
                    onChange={e => handleChange("tienda", e)}
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

                  {/* Enlace a la oferta */}
                  <TextField
                    fullWidth
                    label="Enlace a la oferta"
                    value={formulario.enlace}
                    onChange={e => handleChange("enlace", e)}
                    placeholder="https://..."
                    helperText="URL directa a la oferta"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                {/* URL de imagen con preview en tiempo real */}
                <TextField
                  fullWidth
                  label="URL de imagen (opcional)"
                  value={formulario.imagen}
                  onChange={e => handleChange("imagen", e)}
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

            {/* Botones de guardar y cancelar */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<SaveIcon />}
                onClick={guardarCambios}
                disabled={guardando}
                sx={{ fontWeight: "bold", px: 5, borderRadius: 3 }}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/chollo/${id}`)}
                sx={{ borderRadius: 3 }}
              >
                Cancelar
              </Button>
            </Box>

          </Stack>
        </Grid>

        {/* Columna derecha: preview del chollo */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>

              {/* Imagen de preview */}
              <Box
                component="img"
                src={imagenPreview}
                alt="preview"
                onError={e => { e.target.src = IMAGEN_POR_DEFECTO; }}
                sx={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
              />

              <Box sx={{ p: 3 }}>
                {/* Etiquetas de categoría, ciudad y descuento */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {formulario.categoria && (
                    <Chip icon={<LocalOfferIcon />} label={formulario.categoria}
                      size="small" color="error" variant="outlined" />
                  )}
                  {formulario.ciudad && (
                    <Chip label={`📍 ${formulario.ciudad}`} size="small" variant="outlined" />
                  )}
                  {descuento !== null && descuento > 0 && (
                    <Chip label={`-${descuento}%`} size="small" color="success"
                      sx={{ fontWeight: "bold" }} />
                  )}
                </Stack>

                {/* Título */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {formulario.titulo || <span style={{ color: "#bbb" }}>Título del chollo</span>}
                </Typography>

                {/* Descripción */}
                {formulario.descripcion
                  ? <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{formulario.descripcion}</Typography>
                  : <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>Aquí aparecerá la descripción...</Typography>
                }

                <Divider sx={{ mb: 2 }} />

                {/* Precios */}
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {formulario.precioOferta ? `${parseFloat(formulario.precioOferta).toFixed(2)} €` : "— €"}
                  </Typography>
                  {formulario.precioOriginal && (
                    <Typography variant="body1" sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                      {parseFloat(formulario.precioOriginal).toFixed(2)} €
                    </Typography>
                  )}
                </Stack>

                {/* Nombre de la tienda */}
                {formulario.tienda && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <StoreIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">{formulario.tienda}</Typography>
                  </Stack>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                  Publicado por <strong>{usuario.nombre}</strong>
                </Typography>
              </Box>
            </Paper>

            {/* Aviso sobre la fecha de expiración */}
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "#fff8e1" }}>
              <Typography variant="caption" color="text.secondary">
                ⚠️ Al editar, el tiempo de expiración del chollo <strong>no se reinicia</strong>.
                El chollo seguirá expirando en la misma fecha original.
              </Typography>
            </Paper>
          </Box>
        </Grid>

      </Grid>
    </Container>
  );
}

export default EditarChollo;