import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  Typography, Box, Button, Container,
  Card, CardContent, CardMedia, Grid, Stack, Paper,
  FormControlLabel, Select, MenuItem, Divider,
  Slider, Radio, RadioGroup, Chip, Tooltip,
  ToggleButton, ToggleButtonGroup, TextField,
  CircularProgress, Drawer, IconButton,
} from "@mui/material";
import ViewListIcon    from "@mui/icons-material/ViewList";
import MapIcon         from "@mui/icons-material/Map";
import AccessTimeIcon  from "@mui/icons-material/AccessTime";
import FilterListIcon  from "@mui/icons-material/FilterList";
import CloseIcon       from "@mui/icons-material/Close";
import { estaExpirado }    from "./PublicarChollo";
import { normalizeChollo } from "../api/utils";
import api                 from "../api/client";
import MapaChollos         from "./MapaChollos";

const categories = ["Electrónica","Moda","Hogar","Alimentación","Deportes","Servicios","Otros"];

const regions = [
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

function tiempoRestante(expiraEn) {
  if (!expiraEn) return null;
  const ms = expiraEn - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `Expira en ${h}h ${m}m` : `Expira en ${m}m`;
}

function DealCard({ deal, onClick }) {
  const expirado = estaExpirado(deal);
  const restante = !expirado ? tiempoRestante(deal.expiraEn) : null;

  return (
    <Card onClick={!expirado ? onClick : undefined} sx={{
      display: "flex", flexDirection: { xs: "column", sm: "row" }, borderRadius: 3,
      cursor: expirado ? "default" : "pointer", opacity: expirado ? 0.5 : 1,
      filter: expirado ? "grayscale(60%)" : "none", transition: "0.2s",
      "&:hover": !expirado ? { transform: "scale(1.02)", boxShadow: 6 } : {},
    }}>
      <CardMedia component="img" image={deal.imagen} alt={deal.titulo}
        sx={{ width: { xs: "100%", sm: 220 }, height: { xs: 180, sm: "auto" }, objectFit: "cover" }} />
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          {expirado && <Chip icon={<AccessTimeIcon />} label="Expirado" size="small" sx={{ bgcolor: "#e0e0e0", color: "#757575", fontWeight: "bold" }} />}
          {!expirado && restante && (
            <Tooltip title="Este chollo expirará pronto" arrow>
              <Chip icon={<AccessTimeIcon />} label={restante} size="small" color="warning" variant="outlined" />
            </Tooltip>
          )}
          {deal.publicadoPor && <Chip label={`Por ${deal.publicadoPor}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />}
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{deal.titulo}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>{deal.descripcion}</Typography>
        <Typography variant="h6" sx={{ color: expirado ? "text.disabled" : "error.main", fontWeight: "bold" }}>{deal.precioOferta} €</Typography>
        <Typography variant="body2" sx={{ textDecoration: "line-through", color: "gray" }}>{deal.precioOriginal} €</Typography>
        <Typography variant="body2" sx={{ color: expirado ? "text.disabled" : "green", fontWeight: "bold" }}>{deal.descuento}</Typography>
      </CardContent>
    </Card>
  );
}

function ContenidoFiltros({
  selectedCategory, setSelectedCategory,
  priceMin, setPriceMin, priceMax, setPriceMax,
  selectedRegion, setSelectedRegion, orderBy, setOrderBy,
  applyFilters, resetFilters, onAplicar,
}) {
  function handleAplicar() { applyFilters(); if (onAplicar) onAplicar(); }

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Filtros</Typography>
      <Typography sx={{ fontWeight: "bold", mb: 1 }}>Categoría</Typography>
      <RadioGroup value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        {categories.map((cat) => <FormControlLabel key={cat} value={cat} control={<Radio />} label={cat} />)}
      </RadioGroup>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontWeight: "bold", mb: 1 }}>Precio</Typography>
      <Slider value={[priceMin, priceMax]} onChange={(_, v) => { if (Array.isArray(v)) { setPriceMin(v[0]); setPriceMax(v[1]); } }}
        valueLabelDisplay="auto" min={0} max={1000} />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <TextField label="Mín" size="small" type="number" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} fullWidth />
        <TextField label="Máx" size="small" type="number" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} fullWidth />
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ubicación</Typography>
      <Select fullWidth size="small" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} displayEmpty>
        <MenuItem value=""><em>Todas las provincias</em></MenuItem>
        {regions.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </Select>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontWeight: "bold", mb: 1 }}>Ordenar por</Typography>
      <Select fullWidth size="small" value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
        <MenuItem value="recent">Más recientes</MenuItem>
        <MenuItem value="discount">Mayor descuento</MenuItem>
        <MenuItem value="priceLow">Precio más bajo</MenuItem>
        <MenuItem value="priceHigh">Precio más alto</MenuItem>
      </Select>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button fullWidth variant="contained" onClick={handleAplicar} sx={{ borderRadius: 5 }}>Aplicar</Button>
        <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ borderRadius: 5 }}>Limpiar</Button>
      </Stack>
    </>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vista,            setVista]            = useState("lista");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRegion,   setSelectedRegion]   = useState("");
  const [priceMin,         setPriceMin]          = useState(0);
  const [priceMax,         setPriceMax]          = useState(1000);
  const [orderBy,          setOrderBy]           = useState("recent");
  const [filteredDeals,    setFilteredDeals]     = useState([]);
  const [todosLosDeals,    setTodosLosDeals]     = useState([]);
  const [cargando,         setCargando]          = useState(true);
  const [filtrosAbiertos,  setFiltrosAbiertos]   = useState(false);

  useEffect(() => { setVista("lista"); }, [location.key]);

  useEffect(() => {
    async function cargarChollos() {
      setCargando(true);
      try {
        const res = await api.chollos.listar({ por_pagina: 100, solo_activos: 0 });
        const normalizados = (res.data.chollos || []).map(normalizeChollo);
        setTodosLosDeals(normalizados);
        setFilteredDeals(normalizados);
      } catch (err) {
        console.error("Error al cargar chollos:", err.message);
      }
      setCargando(false);
    }
    cargarChollos();
  }, []);

  function applyFilters() {
    let results = [...todosLosDeals];
    if (selectedCategory) results = results.filter((d) => d.categoria === selectedCategory);
    results = results.filter((d) => d.precioOferta >= priceMin && d.precioOferta <= priceMax);
    if (selectedRegion)       results = results.filter((d) => d.ciudad === selectedRegion);
    if (orderBy === "priceLow")  results.sort((a, b) => a.precioOferta - b.precioOferta);
    if (orderBy === "priceHigh") results.sort((a, b) => b.precioOferta - a.precioOferta);
    if (orderBy === "discount")  results.sort((a, b) => parseInt(b.descuento) - parseInt(a.descuento));
    if (orderBy === "recent")    results.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
    setFilteredDeals(results);
  }

  function resetFilters() {
    setSelectedCategory(""); setSelectedRegion(""); setPriceMin(0); setPriceMax(1000); setOrderBy("recent");
    setFilteredDeals(todosLosDeals);
  }

  const activos   = filteredDeals.filter((d) => !estaExpirado(d));
  const expirados = filteredDeals.filter((d) => estaExpirado(d));

  const filtrosProps = {
    selectedCategory, setSelectedCategory, priceMin, setPriceMin,
    priceMax, setPriceMax, selectedRegion, setSelectedRegion,
    orderBy, setOrderBy, applyFilters, resetFilters,
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Container maxWidth="xl" sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Chollos disponibles</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFiltrosAbiertos(true)}
              sx={{ display: { xs: "flex", md: "none" }, color: "#e53935", borderColor: "#e53935", fontWeight: "bold", borderRadius: 2 }}>
              Filtros
            </Button>
            <ToggleButtonGroup value={vista} exclusive onChange={(_, v) => { if (v) setVista(v); }} size="small"
              sx={{ bgcolor: "white", borderRadius: 2, "& .MuiToggleButton-root": { px: 2.5, py: 0.8, fontWeight: "bold", fontSize: 13, border: "1px solid #e0e0e0", "&.Mui-selected": { bgcolor: "#e53935", color: "white", "&:hover": { bgcolor: "#c62828" } } } }}>
              <ToggleButton value="lista">
                <ViewListIcon sx={{ mr: { xs: 0, sm: 0.8 }, fontSize: 18 }} />
                <Box sx={{ display: { xs: "none", sm: "inline" } }}>Lista</Box>
              </ToggleButton>
              <ToggleButton value="mapa">
                <MapIcon sx={{ mr: { xs: 0, sm: 0.8 }, fontSize: 18 }} />
                <Box sx={{ display: { xs: "none", sm: "inline" } }}>Mapa</Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Drawer anchor="left" open={filtrosAbiertos} onClose={() => setFiltrosAbiertos(false)}>
          <Box sx={{ width: 300, p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <IconButton onClick={() => setFiltrosAbiertos(false)}><CloseIcon /></IconButton>
            </Box>
            <ContenidoFiltros {...filtrosProps} onAplicar={() => setFiltrosAbiertos(false)} />
          </Box>
        </Drawer>

        {vista === "mapa" && <Box sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}><MapaChollos /></Box>}

        {vista === "lista" && (
          <Grid container spacing={3} sx={{ pb: 5 }}>
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: "none", md: "block" } }}>
              <Paper sx={{ p: 3, borderRadius: 3 }}><ContenidoFiltros {...filtrosProps} /></Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              {cargando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress color="error" /></Box>
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
                    {activos.map((deal) => <DealCard key={deal.id} deal={deal} onClick={() => navigate(`/chollo/${deal.id}`)} />)}
                    {expirados.length > 0 && (
                      <>
                        <Divider>
                          <Chip icon={<AccessTimeIcon />} label="Chollos expirados (más de 24h)" size="small" sx={{ bgcolor: "#e0e0e0", color: "#757575" }} />
                        </Divider>
                        {expirados.map((deal) => <DealCard key={deal.id} deal={deal} />)}
                      </>
                    )}
                    {activos.length === 0 && expirados.length === 0 && (
                      <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                        <Typography color="text.secondary">No hay chollos que coincidan con los filtros.</Typography>
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