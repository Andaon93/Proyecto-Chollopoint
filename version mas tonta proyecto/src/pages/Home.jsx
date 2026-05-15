import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  Typography, Box, Button, Container,
  Card, CardContent, CardMedia, Grid, Stack, Paper,
  FormControlLabel, Select, MenuItem, Divider,
  Slider, Radio, RadioGroup, Chip, Tooltip,
  ToggleButton, ToggleButtonGroup, TextField,
  CircularProgress,
} from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { estaExpirado } from "./PublicarChollo";
import { normalizeChollo } from "../api/utils";
import api from "../api/client";
import MapaChollos from "./MapaChollos";

const categorias = ["Electrónica", "Moda", "Hogar", "Alimentación", "Deportes", "Servicios", "Otros"];

const provincias = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada",
  "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
  "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida",
  "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense",
  "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel",
  "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza",
];

// muestra cuánto tiempo queda antes de que expire
const tiempoRestante = (expiraEn) => {
  if (!expiraEn) return null;
  const ms = expiraEn - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `Expira en ${h}h ${m}m` : `Expira en ${m}m`;
};

function DealCard({ deal, onClick }) {
  const expirado = estaExpirado(deal);
  const restante = !expirado ? tiempoRestante(deal.expiraEn) : null;

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
      <CardMedia
        component="img"
        image={deal.imagen}
        alt={deal.titulo}
        sx={{ width: 220, objectFit: "cover" }}
      />
      <CardContent sx={{ flex: 1 }}>
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
              <Chip icon={<AccessTimeIcon />} label={restante} size="small" color="warning" variant="outlined" />
            </Tooltip>
          )}
          {deal.publicadoPor && (
            <Chip label={`Por ${deal.publicadoPor}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
          )}
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{deal.titulo}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {deal.descripcion}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: expirado ? "text.disabled" : "error.main", fontWeight: "bold" }}
        >
          {deal.precioOferta} €
        </Typography>
        <Typography variant="body2" sx={{ textDecoration: "line-through", color: "gray" }}>
          {deal.precioOriginal} €
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: expirado ? "text.disabled" : "green", fontWeight: "bold" }}
        >
          {deal.descuento}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [vista, setVista] = useState("lista");
  const [categoria, setCategoria] = useState("");
  const [provincia, setProvincia] = useState("");
  const [precioMin, setPrecioMin] = useState(0);
  const [precioMax, setPrecioMax] = useState(1000);
  const [orden, setOrden] = useState("recent");
  const [chollos, setChollos] = useState([]);
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.chollos
      .listar({ por_pagina: 100, solo_activos: 0 })
      .then((res) => {
        const lista = (res.data.chollos || []).map(normalizeChollo);
        setTodos(lista);
        setChollos(lista);
      })
      .catch((err) => console.error("Error al cargar chollos:", err.message))
      .finally(() => setCargando(false));
  }, []);

  const aplicarFiltros = () => {
    let resultado = [...todos];
    if (categoria) resultado = resultado.filter((d) => d.categoria === categoria);
    resultado = resultado.filter((d) => d.precioOferta >= precioMin && d.precioOferta <= precioMax);
    if (provincia) resultado = resultado.filter((d) => d.ciudad === provincia);
    if (orden === "priceLow") resultado.sort((a, b) => a.precioOferta - b.precioOferta);
    if (orden === "priceHigh") resultado.sort((a, b) => b.precioOferta - a.precioOferta);
    if (orden === "discount") resultado.sort((a, b) => parseInt(b.descuento) - parseInt(a.descuento));
    if (orden === "recent") resultado.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
    setChollos(resultado);
  };

  const limpiarFiltros = () => {
    setCategoria("");
    setProvincia("");
    setPrecioMin(0);
    setPrecioMax(1000);
    setOrden("recent");
    setChollos(todos);
  };

  const activos = chollos.filter((d) => !estaExpirado(d));
  const expirados = chollos.filter((d) => estaExpirado(d));

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Chollos disponibles
          </Typography>

          <ToggleButtonGroup
            value={vista}
            exclusive
            onChange={(_, nueva) => { if (nueva) setVista(nueva); }}
            size="small"
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                px: 2.5, py: 0.8, fontWeight: "bold", fontSize: 13,
                border: "1px solid #e0e0e0",
                "&.Mui-selected": { bgcolor: "#e53935", color: "white", "&:hover": { bgcolor: "#c62828" } },
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

        {vista === "mapa" && (
          <Box sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}>
            <MapaChollos />
          </Box>
        )}

        {vista === "lista" && (
          <Grid container spacing={3} sx={{ pb: 5 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Filtros</Typography>

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Categoría</Typography>
                <RadioGroup value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {categorias.map((cat) => (
                    <FormControlLabel key={cat} value={cat} control={<Radio />} label={cat} />
                  ))}
                </RadioGroup>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Precio</Typography>
                <Slider
                  value={[precioMin, precioMax]}
                  onChange={(_, v) => {
                    if (Array.isArray(v)) { setPrecioMin(v[0]); setPrecioMax(v[1]); }
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1000}
                />
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField label="Mín" size="small" type="number" value={precioMin}
                    onChange={(e) => setPrecioMin(Number(e.target.value))} fullWidth />
                  <TextField label="Máx" size="small" type="number" value={precioMax}
                    onChange={(e) => setPrecioMax(Number(e.target.value))} fullWidth />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ubicación</Typography>
                <Select
                  fullWidth size="small" value={provincia}
                  onChange={(e) => setProvincia(e.target.value)} displayEmpty
                >
                  <MenuItem value=""><em>Todas las provincias</em></MenuItem>
                  {provincias.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>

                <Divider sx={{ my: 2 }} />

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ordenar por</Typography>
                <Select fullWidth size="small" value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <MenuItem value="recent">Más recientes</MenuItem>
                  <MenuItem value="discount">Mayor descuento</MenuItem>
                  <MenuItem value="priceLow">Precio más bajo</MenuItem>
                  <MenuItem value="priceHigh">Precio más alto</MenuItem>
                </Select>

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

            <Grid item xs={12} md={9}>
              {cargando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress color="error" />
                </Box>
              ) : (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {activos.length} {activos.length === 1 ? "chollo activo" : "chollos activos"}
                    {expirados.length > 0 && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        · {expirados.length} expirado{expirados.length > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Typography>

                  <Stack spacing={3}>
                    {activos.map((deal) => (
                      <DealCard key={deal.id} deal={deal} onClick={() => navigate(`/chollo/${deal.id}`)} />
                    ))}

                    {expirados.length > 0 && (
                      <>
                        <Divider>
                          <Chip
                            icon={<AccessTimeIcon />}
                            label="Chollos expirados (más de 24h)"
                            size="small"
                            sx={{ bgcolor: "#e0e0e0", color: "#757575" }}
                          />
                        </Divider>
                        {expirados.map((deal) => (
                          <DealCard key={deal.id} deal={deal} />
                        ))}
                      </>
                    )}

                    {activos.length === 0 && expirados.length === 0 && (
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