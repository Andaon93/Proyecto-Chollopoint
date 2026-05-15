// 📄 MapaChollos.jsx
// Ahora carga los chollos REALES desde la API en lugar de datos hardcodeados.
// Solo muestra en el mapa los chollos que tengan latitud y longitud guardadas
// (es decir, los que se publicaron con ubicación exacta).

import React, { useState, useEffect } from "react";
import {
  Typography, Box, Button, TextField, Paper,
  Stack, Divider, Slider, RadioGroup, FormControlLabel,
  Radio, Select, MenuItem, Chip, CircularProgress,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/client";
import { normalizeChollo } from "../api/utils";

// ─── Arreglar iconos por defecto de Leaflet ───────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// ─── Icono personalizado para TU UBICACIÓN (azul) ────────────────────────────
const iconoUbicacion = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 20px; height: 20px;
      background: #1976d2;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 3px #1976d2aa;
    "></div>`,
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
});

// ─── Icono personalizado para cada CHOLLO (rojo con llama) ───────────────────
const crearIconoChollo = (precio) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background: linear-gradient(135deg, #e53935, #ff7043);
        color: white;
        font-weight: bold;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 14px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 3px;
        position: relative;
      ">
        🔥 ${precio}€
        <div style="
          position: absolute;
          bottom: -7px; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid #e53935;
        "></div>
      </div>`,
    iconSize:   [80, 32],
    iconAnchor: [40, 39],
  });

// ─── Componente que mueve el mapa cuando cambia la posición ──────────────────
function ActualizarMapa({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) {
      map.setView(posicion, 6);
      setTimeout(() => map.invalidateSize(), 400);
    }
  }, [posicion, map]);
  return null;
}

// ─── Constantes de filtros ────────────────────────────────────────────────────
const CATEGORIAS = ["Electrónica", "Moda", "Hogar", "Alimentación", "Deportes", "Viajes", "Servicios", "Otros"];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapaChollos() {
  const navigate = useNavigate();

  const [position,      setPosition]      = useState(null);
  const [todosLosDeals, setTodosLosDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [cargando,      setCargando]      = useState(true);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceMin,         setPriceMin]          = useState(0);
  const [priceMax,         setPriceMax]          = useState(1000);
  const [orderBy,          setOrderBy]           = useState("recent");

  // ── Obtener ubicación del usuario ────────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        ()    => setPosition([40.4168, -3.7038]) // fallback: Madrid
      );
    } else {
      setPosition([40.4168, -3.7038]);
    }
  }, []);

  // ── Cargar chollos desde la API ───────────────────────────────────────────────
  // Solo nos quedamos con los que tienen coordenadas (latitud y longitud)
  useEffect(() => {
    setCargando(true);
    api.chollos.listar({ por_pagina: 200, solo_activos: 1 })
      .then((res) => {
        const normalizados = (res.data.chollos || [])
          .map(normalizeChollo)
          .filter((c) => c.latitud != null && c.longitud != null); // solo los que tienen ubicación
        setTodosLosDeals(normalizados);
        setFilteredDeals(normalizados);
      })
      .catch((err) => console.error("Error al cargar chollos para el mapa:", err.message))
      .finally(() => setCargando(false));
  }, []);

  // ── Aplicar filtros ──────────────────────────────────────────────────────────
  const applyFilters = () => {
    let results = [...todosLosDeals];
    if (selectedCategory)
      results = results.filter((d) => d.categoria === selectedCategory);
    results = results.filter((d) => d.precioOferta >= priceMin && d.precioOferta <= priceMax);
    if (orderBy === "priceLow")  results.sort((a, b) => a.precioOferta - b.precioOferta);
    if (orderBy === "priceHigh") results.sort((a, b) => b.precioOferta - a.precioOferta);
    if (orderBy === "discount")  results.sort((a, b) => parseInt(b.descuento) - parseInt(a.descuento));
    if (orderBy === "recent")    results.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
    setFilteredDeals(results);
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setPriceMin(0); setPriceMax(1000); setOrderBy("recent");
    setFilteredDeals(todosLosDeals);
  };

  // ── Estados de carga ─────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 140px)", width: "100%" }}>

      {/* ── SIDEBAR ── */}
      <Box sx={{
        width: { xs: "100%", md: 320 },
        bgcolor: "white",
        p: 2.5,
        overflowY: "auto",
        borderRight: "1px solid #ddd",
        flexShrink: 0,
      }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1, color: "#e53935" }}>
          🔥 Filtros
        </Typography>

        {/* Contador */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredDeals.length} {filteredDeals.length === 1 ? "chollo" : "chollos"} en el mapa
          {todosLosDeals.length === 0 && !cargando && (
            <Box component="span" sx={{ display: "block", mt: 0.5, color: "warning.main" }}>
              (Aún no hay chollos con ubicación exacta)
            </Box>
          )}
        </Typography>

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Categoría</Typography>
        <RadioGroup value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {CATEGORIAS.map((cat) => (
            <FormControlLabel key={cat} value={cat} control={<Radio size="small" />} label={cat} />
          ))}
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Precio</Typography>
        <Slider
          value={[priceMin, priceMax]}
          onChange={(_, val) => { setPriceMin(val[0]); setPriceMax(val[1]); }}
          valueLabelDisplay="auto"
          min={0} max={1000}
          sx={{ mb: 1, color: "#e53935" }}
        />
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField label="Mín" size="small" type="number" value={priceMin}
            onChange={(e) => setPriceMin(Number(e.target.value))} fullWidth />
          <TextField label="Máx" size="small" type="number" value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))} fullWidth />
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
          <Button fullWidth variant="contained" onClick={applyFilters}
            sx={{ borderRadius: 5, bgcolor: "#e53935", "&:hover": { bgcolor: "#c62828" } }}>
            Aplicar
          </Button>
          <Button fullWidth variant="outlined" onClick={resetFilters}
            sx={{ borderRadius: 5, color: "#e53935", borderColor: "#e53935" }}>
            Limpiar
          </Button>
        </Stack>

        {/* Lista rápida */}
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Chollos en mapa</Typography>

        {filteredDeals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Ningún chollo visible con los filtros actuales.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filteredDeals.map((deal) => (
              <Paper
                key={deal.id}
                elevation={0}
                onClick={() => navigate(`/chollo/${deal.id}`)}
                sx={{
                  p: 1.2, border: "1px solid #eee", borderRadius: 2,
                  cursor: "pointer", "&:hover": { bgcolor: "#fff5f5", borderColor: "#e53935" },
                }}
              >
                <Typography variant="body2" fontWeight="bold" noWrap>{deal.titulo}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="error" fontWeight="bold">
                    {deal.precioOferta}€
                  </Typography>
                  <Chip label={deal.descuento} size="small"
                    sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 10, height: 18 }} />
                  <Typography variant="caption" color="text.secondary">{deal.ciudad}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* ── MAPA ── */}
      <Box sx={{ flexGrow: 1 }}>
        <MapContainer
          center={[40.2, -3.5]}
          zoom={6}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ActualizarMapa posicion={position} />

          {/* 📍 Marcador de TU UBICACIÓN */}
          <Marker position={position} icon={iconoUbicacion}>
            <Popup>
              <Typography fontWeight="bold" fontSize={14}>📍 Estás aquí</Typography>
            </Popup>
          </Marker>

          {/* 🔥 Marcador por cada CHOLLO con coordenadas */}
          {filteredDeals.map((deal) => (
            <Marker
              key={deal.id}
              position={[deal.latitud, deal.longitud]}
              icon={crearIconoChollo(deal.precioOferta)}
            >
              <Popup minWidth={240}>
                {/* Imagen */}
                <Box
                  component="img"
                  src={deal.imagen}
                  alt={deal.titulo}
                  sx={{
                    width: "100%", height: 120,
                    objectFit: "cover", borderRadius: 1,
                    display: "block", mb: 1,
                  }}
                />

                {/* Info */}
                <Typography fontWeight="bold" fontSize={13} gutterBottom>
                  {deal.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {deal.descripcion}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight="bold" color="error" fontSize={16}>
                    {deal.precioOferta}€
                  </Typography>
                  <Typography sx={{ textDecoration: "line-through", color: "gray", fontSize: 12 }}>
                    {deal.precioOriginal}€
                  </Typography>
                  <Chip
                    label={deal.descuento}
                    size="small"
                    sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 11 }}
                  />
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }} flexWrap="wrap">
                  {deal.categoria && <Chip label={deal.categoria} size="small" variant="outlined" />}
                  {deal.ciudad    && <Chip label={deal.ciudad}    size="small" variant="outlined" />}
                  {deal.tienda    && <Chip label={deal.tienda}    size="small" variant="outlined" />}
                </Stack>

                {/* Botón detalle */}
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => navigate(`/chollo/${deal.id}`)}
                  sx={{
                    bgcolor: "#e53935", fontWeight: "bold",
                    "&:hover": { bgcolor: "#c62828" },
                  }}
                >
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