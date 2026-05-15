import React, { useState, useEffect } from "react";
import {
  Typography, Box, Button, TextField, Paper,
  Stack, Divider, Slider, RadioGroup, FormControlLabel,
  Radio, Select, MenuItem, Chip, CircularProgress,
  Drawer, IconButton,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon      from "@mui/icons-material/Close";
import api              from "../api/client";
import { normalizeChollo } from "../api/utils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const iconoUbicacion = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#1976d2;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #1976d2aa;"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});

function crearIconoChollo(precio) {
  return L.divIcon({
    className: "",
    html: `<div style="background:linear-gradient(135deg,#e53935,#ff7043);color:white;font-weight:bold;font-size:11px;padding:4px 8px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);border:2px solid white;display:flex;align-items:center;gap:3px;position:relative;">🔥 ${precio}€<div style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid #e53935;"></div></div>`,
    iconSize: [80, 32], iconAnchor: [40, 39],
  });
}

function ActualizarMapa({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) { map.setView(posicion, 13); setTimeout(() => map.invalidateSize(), 400); }
  }, [posicion, map]);
  return null;
}

const CATEGORIAS = ["Electrónica", "Moda", "Hogar", "Alimentación", "Deportes", "Viajes", "Servicios", "Otros"];

function ContenidoFiltros({
  selectedCategory, setSelectedCategory, priceMin, setPriceMin,
  priceMax, setPriceMax, orderBy, setOrderBy,
  applyFilters, resetFilters, filteredDeals, todosLosDeals, cargando, onAplicar,
}) {
  function handleAplicar() { applyFilters(); if (onAplicar) onAplicar(); }

  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#e53935" }}>🔥 Filtros</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredDeals.length} {filteredDeals.length === 1 ? "chollo" : "chollos"} en el mapa
        {todosLosDeals.length === 0 && !cargando && (
          <Box component="span" sx={{ display: "block", mt: 0.5, color: "warning.main" }}>(Aún no hay chollos con ubicación exacta)</Box>
        )}
      </Typography>
      <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Categoría</Typography>
      <RadioGroup value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        {CATEGORIAS.map((cat) => <FormControlLabel key={cat} value={cat} control={<Radio size="small" />} label={cat} />)}
      </RadioGroup>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Precio</Typography>
      <Slider value={[priceMin, priceMax]} onChange={(_, val) => { setPriceMin(val[0]); setPriceMax(val[1]); }}
        valueLabelDisplay="auto" min={0} max={1000} sx={{ mb: 1, color: "#e53935" }} />
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField label="Mín" size="small" type="number" value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} fullWidth />
        <TextField label="Máx" size="small" type="number" value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} fullWidth />
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Ordenar por</Typography>
      <Select fullWidth size="small" value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
        <MenuItem value="recent">Más recientes</MenuItem>
        <MenuItem value="discount">Mayor descuento</MenuItem>
        <MenuItem value="priceLow">Precio más bajo</MenuItem>
        <MenuItem value="priceHigh">Precio más alto</MenuItem>
      </Select>
      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
        <Button fullWidth variant="contained" onClick={handleAplicar} sx={{ borderRadius: 5, bgcolor: "#e53935", "&:hover": { bgcolor: "#c62828" } }}>Aplicar</Button>
        <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ borderRadius: 5, color: "#e53935", borderColor: "#e53935" }}>Limpiar</Button>
      </Stack>
    </>
  );
}

export default function MapaChollos() {
  const navigate = useNavigate();

  const [position,      setPosition]      = useState(null);
  const [todosLosDeals, setTodosLosDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceMin,          setPriceMin]          = useState(0);
  const [priceMax,          setPriceMax]          = useState(1000);
  const [orderBy,           setOrderBy]           = useState("recent");
  const [filtrosAbiertos,   setFiltrosAbiertos]   = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        ()    => setPosition([40.4168, -3.7038])
      );
    } else {
      setPosition([40.4168, -3.7038]);
    }
  }, []);

  useEffect(() => {
    async function cargarChollos() {
      setCargando(true);
      try {
        const res = await api.chollos.listar({ por_pagina: 200, solo_activos: 1 });
        const conUbicacion = (res.data.chollos || []).map(normalizeChollo).filter(c => c.latitud != null && c.longitud != null);
        setTodosLosDeals(conUbicacion);
        setFilteredDeals(conUbicacion);
      } catch (err) {
        console.error("Error al cargar chollos para el mapa:", err.message);
      }
      setCargando(false);
    }
    cargarChollos();
  }, []);

  function applyFilters() {
    let results = [...todosLosDeals];
    if (selectedCategory) results = results.filter((d) => d.categoria === selectedCategory);
    results = results.filter((d) => d.precioOferta >= priceMin && d.precioOferta <= priceMax);
    if (orderBy === "priceLow")  results.sort((a, b) => a.precioOferta - b.precioOferta);
    if (orderBy === "priceHigh") results.sort((a, b) => b.precioOferta - a.precioOferta);
    if (orderBy === "discount")  results.sort((a, b) => parseInt(b.descuento) - parseInt(a.descuento));
    if (orderBy === "recent")    results.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
    setFilteredDeals(results);
  }

  function resetFilters() {
    setSelectedCategory(""); setPriceMin(0); setPriceMax(1000); setOrderBy("recent");
    setFilteredDeals(todosLosDeals);
  }

  const filtrosProps = {
    selectedCategory, setSelectedCategory, priceMin, setPriceMin, priceMax, setPriceMax,
    orderBy, setOrderBy, applyFilters, resetFilters, filteredDeals, todosLosDeals, cargando,
  };

  if (!position || cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="error" />
          <Typography color="text.secondary">Cargando mapa...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "calc(100dvh - 140px)", width: "100%", overflow: "hidden" }}>
      <Box sx={{ width: 320, bgcolor: "white", p: 2.5, overflowY: "auto", overflowX: "hidden", borderRight: "1px solid #ddd", flexShrink: 0, display: { xs: "none", md: "block" } }}>
        <ContenidoFiltros {...filtrosProps} />
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Chollos en mapa</Typography>
        {filteredDeals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>Ningún chollo visible con los filtros actuales.</Typography>
        ) : (
          <Stack spacing={1}>
            {filteredDeals.map((deal) => (
              <Paper key={deal.id} elevation={0} onClick={() => navigate(`/chollo/${deal.id}`)}
                sx={{ p: 1.2, border: "1px solid #eee", borderRadius: 2, cursor: "pointer", "&:hover": { bgcolor: "#fff5f5", borderColor: "#e53935" } }}>
                <Typography variant="body2" fontWeight="bold" noWrap>{deal.titulo}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="error" fontWeight="bold">{deal.precioOferta}€</Typography>
                  <Chip label={deal.descuento} size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 10, height: 18 }} />
                  <Typography variant="caption" color="text.secondary">{deal.ciudad}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Drawer anchor="left" open={filtrosAbiertos} onClose={() => setFiltrosAbiertos(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <IconButton onClick={() => setFiltrosAbiertos(false)}><CloseIcon /></IconButton>
          </Box>
          <ContenidoFiltros {...filtrosProps} onAplicar={() => setFiltrosAbiertos(false)} />
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, position: "relative" }}>
        <Button variant="contained" startIcon={<FilterListIcon />} onClick={() => setFiltrosAbiertos(true)}
          sx={{ display: { xs: "flex", md: "none" }, position: "absolute", top: 12, left: 12, zIndex: 1000, bgcolor: "#e53935", color: "white", fontWeight: "bold", borderRadius: 3, boxShadow: 3, "&:hover": { bgcolor: "#c62828" } }}>
          Filtros
        </Button>
        <MapContainer center={[40.2, -3.5]} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ActualizarMapa posicion={position} />
          <Marker position={position} icon={iconoUbicacion}>
            <Popup><Typography fontWeight="bold" fontSize={14}>📍 Estás aquí</Typography></Popup>
          </Marker>
          {filteredDeals.map((deal) => (
            <Marker key={deal.id} position={[deal.latitud, deal.longitud]} icon={crearIconoChollo(deal.precioOferta)}>
              <Popup minWidth={240}>
                <Box component="img" src={deal.imagen} alt={deal.titulo}
                  sx={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 1, display: "block", mb: 1 }} />
                <Typography fontWeight="bold" fontSize={13} gutterBottom>{deal.titulo}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{deal.descripcion}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight="bold" color="error" fontSize={16}>{deal.precioOferta}€</Typography>
                  <Typography sx={{ textDecoration: "line-through", color: "gray", fontSize: 12 }}>{deal.precioOriginal}€</Typography>
                  <Chip label={deal.descuento} size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 11 }} />
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }} flexWrap="wrap">
                  {deal.categoria && <Chip label={deal.categoria} size="small" variant="outlined" />}
                  {deal.ciudad    && <Chip label={deal.ciudad}    size="small" variant="outlined" />}
                  {deal.tienda    && <Chip label={deal.tienda}    size="small" variant="outlined" />}
                </Stack>
                <Button fullWidth variant="contained" size="small" onClick={() => navigate(`/chollo/${deal.id}`)}
                  sx={{ bgcolor: "#e53935", fontWeight: "bold", "&:hover": { bgcolor: "#c62828" } }}>
                  Ver chollo completo →
                </Button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
}