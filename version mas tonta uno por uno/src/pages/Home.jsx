// 📄 Home.jsx
// Página principal de CholloPoint.
// Carga los chollos desde la API y permite filtrarlos
// por categoría, precio, provincia y orden.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography, Box, Button, Container,
  Card, CardContent, CardMedia, Grid, Stack, Paper,
  FormControlLabel, Select, MenuItem, Divider,
  Slider, Radio, RadioGroup, Chip, Tooltip,
  ToggleButton, ToggleButtonGroup, TextField,
  CircularProgress,
} from "@mui/material";
import ViewListIcon   from "@mui/icons-material/ViewList";
import MapIcon        from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { estaExpirado }    from "./PublicarChollo";
import { normalizeChollo } from "../api/utils";
import api                 from "../api/client";
import MapaChollos         from "./MapaChollos";

// Categorías disponibles para filtrar
const CATEGORIAS = [
  "Electrónica", "Moda", "Hogar", "Alimentación",
  "Deportes", "Servicios", "Otros",
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

/**
 * Calcula el tiempo restante hasta que expira un chollo
 * @param {number} expiraEn - Timestamp de expiración
 * @returns {string|null} Texto con el tiempo restante o null si ya expiró
 */
function tiempoRestante(expiraEn) {
  if (!expiraEn) return null;

  const miliSegundos = expiraEn - Date.now();
  if (miliSegundos <= 0) return null;

  const horas   = Math.floor(miliSegundos / 3600000);
  const minutos = Math.floor((miliSegundos % 3600000) / 60000);

  return horas > 0 ? `Expira en ${horas}h ${minutos}m` : `Expira en ${minutos}m`;
}

/**
 * Tarjeta visual de un chollo individual
 * @param {Object} props
 * @param {Object} props.chollo - Datos del chollo a mostrar
 * @param {Function} props.onClick - Función al hacer click en la tarjeta
 */
function TarjetaChollo({ chollo, onClick }) {
  const expirado  = estaExpirado(chollo);
  const restante  = !expirado ? tiempoRestante(chollo.expiraEn) : null;

  return (
    <Card
      onClick={!expirado ? onClick : undefined}
      sx={{
        display: "flex",
        borderRadius: 3,
        cursor: expirado ? "default" : "pointer",
        opacity: expirado ? 0.5 : 1,
        filter: expirado ? "grayscale(60%)" : "none",
        transition: "0.2s",
        "&:hover": !expirado ? { transform: "scale(1.02)", boxShadow: 6 } : {},
      }}
    >
      {/* Imagen del producto */}
      <CardMedia
        component="img"
        image={chollo.imagen}
        alt={chollo.titulo}
        sx={{ width: 220, objectFit: "cover" }}
      />

      <CardContent sx={{ flex: 1 }}>
        {/* Etiquetas de estado y autor */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          {expirado && (
            <Chip
              icon={<AccessTimeIcon />}
              label="Expirado"
              size="small"
              sx={{ bgcolor: "#e0e0e0", color: "#757575", fontWeight: "bold" }}
            />
          )}
          {!expirado && restante && (
            <Tooltip title="Este chollo expirará pronto" arrow>
              <Chip
                icon={<AccessTimeIcon />}
                label={restante}
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          )}
          {chollo.publicadoPor && (
            <Chip
              label={`Por ${chollo.publicadoPor}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          )}
        </Stack>

        {/* Título y descripción */}
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{chollo.titulo}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {chollo.descripcion}
        </Typography>

        {/* Precios */}
        <Typography variant="h6" sx={{ color: expirado ? "text.disabled" : "error.main", fontWeight: "bold" }}>
          {chollo.precioOferta} €
        </Typography>
        <Typography variant="body2" sx={{ textDecoration: "line-through", color: "gray" }}>
          {chollo.precioOriginal} €
        </Typography>
        <Typography variant="body2" sx={{ color: expirado ? "text.disabled" : "green", fontWeight: "bold" }}>
          {chollo.descuento}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();

  // Vista activa: lista o mapa
  const [vista, setVista] = useState("lista");

  // Todos los chollos cargados de la API
  const [todosLosChollos,    setTodosLosChollos]    = useState([]);
  // Chollos después de aplicar los filtros
  const [chollosFiltrados,   setChollosFiltrados]   = useState([]);
  // Estado de carga
  const [cargando,           setCargando]           = useState(true);

  // Filtros del sidebar
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [precioMinimo,          setPrecioMinimo]          = useState(0);
  const [precioMaximo,          setPrecioMaximo]          = useState(1000);
  const [orden,                 setOrden]                 = useState("recent");

  /**
   * Carga todos los chollos desde el backend al entrar en la página
   */
  useEffect(() => {
    async function fetchChollos() {
      setCargando(true);
      try {
        const respuesta = await api.chollos.listar({ por_pagina: 100, solo_activos: 0 });
        const normalizados = (respuesta.data.chollos || []).map(normalizeChollo);
        setTodosLosChollos(normalizados);
        setChollosFiltrados(normalizados);
      } catch (error) {
        console.error("Error al cargar los chollos:", error);
      }
      setCargando(false);
    }

    fetchChollos();
  }, []);

  /**
   * Aplica los filtros seleccionados sobre la lista completa de chollos
   */
  function aplicarFiltros() {
    let resultado = [...todosLosChollos];

    // Filtrar por categoría si hay una seleccionada
    if (categoriaSeleccionada) {
      resultado = resultado.filter(c => c.categoria === categoriaSeleccionada);
    }

    // Filtrar por rango de precio
    resultado = resultado.filter(c => c.precioOferta >= precioMinimo && c.precioOferta <= precioMaximo);

    // Filtrar por provincia si hay una seleccionada
    if (provinciaSeleccionada) {
      resultado = resultado.filter(c => c.ciudad === provinciaSeleccionada);
    }

    // Ordenar según la opción elegida
    if (orden === "priceLow")  resultado.sort((a, b) => a.precioOferta - b.precioOferta);
    if (orden === "priceHigh") resultado.sort((a, b) => b.precioOferta - a.precioOferta);
    if (orden === "discount")  resultado.sort((a, b) => parseInt(b.descuento) - parseInt(a.descuento));
    if (orden === "recent")    resultado.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));

    setChollosFiltrados(resultado);
  }

  /**
   * Restablece todos los filtros a sus valores por defecto
   */
  function limpiarFiltros() {
    setCategoriaSeleccionada("");
    setProvinciaSeleccionada("");
    setPrecioMinimo(0);
    setPrecioMaximo(1000);
    setOrden("recent");
    setChollosFiltrados(todosLosChollos);
  }

  // Separar chollos activos de expirados para mostrarlos en secciones distintas
  const chollosActivos   = chollosFiltrados.filter(c => !estaExpirado(c));
  const chollosExpirados = chollosFiltrados.filter(c => estaExpirado(c));

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Container maxWidth="xl" sx={{ pt: 2 }}>

        {/* Cabecera con el toggle lista/mapa */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Chollos disponibles
          </Typography>

          <ToggleButtonGroup
            value={vista}
            exclusive
            onChange={(_, nuevaVista) => { if (nuevaVista) setVista(nuevaVista); }}
            size="small"
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                px: 2.5, py: 0.8, fontWeight: "bold", fontSize: 13,
                border: "1px solid #e0e0e0",
                "&.Mui-selected": {
                  bgcolor: "#e53935", color: "white",
                  "&:hover": { bgcolor: "#c62828" },
                },
              },
            }}
          >
            <ToggleButton value="lista">
              <ViewListIcon sx={{ mr: 0.8, fontSize: 18 }} />
              Lista
            </ToggleButton>
            <ToggleButton value="mapa">
              <MapIcon sx={{ mr: 0.8, fontSize: 18 }} />
              Mapa
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Vista de mapa */}
        {vista === "mapa" && (
          <Box sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
            <MapaChollos />
          </Box>
        )}

        {/* Vista de lista con filtros */}
        {vista === "lista" && (
          <Grid container spacing={3} sx={{ pb: 5 }}>

            {/* Sidebar de filtros */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Filtros</Typography>

                {/* Filtro por categoría */}
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Categoría</Typography>
                <RadioGroup
                  value={categoriaSeleccionada}
                  onChange={e => setCategoriaSeleccionada(e.target.value)}
                >
                  {CATEGORIAS.map(cat => (
                    <FormControlLabel key={cat} value={cat} control={<Radio />} label={cat} />
                  ))}
                </RadioGroup>

                <Divider sx={{ my: 2 }} />

                {/* Filtro por rango de precio */}
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Precio</Typography>
                <Slider
                  value={[precioMinimo, precioMaximo]}
                  onChange={(_, valores) => {
                    if (Array.isArray(valores)) {
                      setPrecioMinimo(valores[0]);
                      setPrecioMaximo(valores[1]);
                    }
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                />
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Mín" size="small" type="number"
                    value={precioMinimo}
                    onChange={e => setPrecioMinimo(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="Máx" size="small" type="number"
                    value={precioMaximo}
                    onChange={e => setPrecioMaximo(Number(e.target.value))}
                    fullWidth
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Filtro por provincia */}
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ubicación</Typography>
                <Select
                  fullWidth size="small"
                  value={provinciaSeleccionada}
                  onChange={e => setProvinciaSeleccionada(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value=""><em>Todas las provincias</em></MenuItem>
                  {PROVINCIAS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>

                <Divider sx={{ my: 2 }} />

                {/* Filtro de ordenación */}
                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ordenar por</Typography>
                <Select
                  fullWidth size="small"
                  value={orden}
                  onChange={e => setOrden(e.target.value)}
                >
                  <MenuItem value="recent">Más recientes</MenuItem>
                  <MenuItem value="discount">Mayor descuento</MenuItem>
                  <MenuItem value="priceLow">Precio más bajo</MenuItem>
                  <MenuItem value="priceHigh">Precio más alto</MenuItem>
                </Select>

                {/* Botones de aplicar y limpiar filtros */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button fullWidth variant="contained" onClick={aplicarFiltros} sx={{ borderRadius: 5 }}>
                    Aplicar
                  </Button>
                  <Button fullWidth variant="outlined" onClick={limpiarFiltros} sx={{ borderRadius: 5 }}>
                    Limpiar
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Listado de chollos */}
            <Grid item xs={12} md={9}>

              {/* Spinner mientras carga */}
              {cargando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress color="error" />
                </Box>
              ) : (
                <>
                  {/* Contador de resultados */}
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {chollosActivos.length} {chollosActivos.length === 1 ? "chollo activo" : "chollos activos"}
                    {chollosExpirados.length > 0 && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        · {chollosExpirados.length} expirado{chollosExpirados.length > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Typography>

                  <Stack spacing={3}>
                    {/* Chollos activos */}
                    {chollosActivos.map(chollo => (
                      <TarjetaChollo
                        key={chollo.id}
                        chollo={chollo}
                        onClick={() => navigate(`/chollo/${chollo.id}`)}
                      />
                    ))}

                    {/* Sección de chollos expirados */}
                    {chollosExpirados.length > 0 && (
                      <>
                        <Divider>
                          <Chip
                            icon={<AccessTimeIcon />}
                            label="Chollos expirados (más de 24h)"
                            size="small"
                            sx={{ bgcolor: "#e0e0e0", color: "#757575" }}
                          />
                        </Divider>
                        {chollosExpirados.map(chollo => (
                          <TarjetaChollo key={chollo.id} chollo={chollo} />
                        ))}
                      </>
                    )}

                    {/* Mensaje si no hay resultados con los filtros aplicados */}
                    {chollosActivos.length === 0 && chollosExpirados.length === 0 && (
                      <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                        <Typography color="text.secondary">
                          No hay chollos que coincidan con los filtros.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </>
              )}
            </Grid>
          </Grid>
        )}

      </Container>
    </Box>
  );
}

export default Home;