// 📄 MapaChollos.jsx
// Ahora el mapa muestra DOS tipos de marcadores:
//   📍 Tu ubicación actual (marcador azul especial)
//   🏷️ Cada chollo con su ubicación (marcadores rojos personalizados)
// Al hacer clic en un marcador de chollo, se abre un popup con
// el resumen y un botón para ver el detalle completo.

import React, { useState, useEffect, useRef } from "react";
import {
  Typography, Box, Button, TextField, Paper,
  Stack, Divider, Slider, RadioGroup, FormControlLabel,
  Radio, Select, MenuItem, Chip
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
// Recibe el precio para mostrarlo dentro del marcador
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
    iconAnchor: [40, 39], // punta de la flecha
  });

// ─── Componente que mueve el mapa cuando cambia la posición ──────────────────
function ActualizarMapa({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) {
      map.setView(posicion, 6); // zoom 6 para ver toda España
      setTimeout(() => map.invalidateSize(), 400);
    }
  }, [posicion, map]);
  return null;
}

// ─── Datos de chollos con coordenadas reales ──────────────────────────────────
const categories = ["Electrónica", "Moda", "Hogar", "Alimentación", "Deportes"];
const regions    = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Zaragoza", "Málaga"];

const deals = [
  {
    id: 1,
    title: "Menú Pizza Mediana + Bebida",
    description: "Válido hasta fin de mes en todos los locales",
    price: 9.95,
    oldPrice: 18.95,
    discount: "-47%",
    tag: "Alimentación",
    location: "Madrid",
    tienda: "PizzaPlace",
    lat: 40.4168,
    lng: -3.7038,
    imagen: "https://images.unsplash.com/photo-1601924638867-3ec2f9b5b0b0?q=80&w=400",
  },
  {
    id: 2,
    title: "PlayStation 5 + 2 Juegos",
    description: "PS5 con lector + Spider-Man 2 + FIFA 24",
    price: 499.99,
    oldPrice: 649.99,
    discount: "-23%",
    tag: "Electrónica",
    location: "Barcelona",
    tienda: "GameStore",
    lat: 41.3851,
    lng: 2.1734,
    imagen: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=400",
  },
  {
    id: 3,
    title: "Zapatillas Running Nike Air",
    description: "Tallas 38 a 46 disponibles, colores variados",
    price: 59.99,
    oldPrice: 120.00,
    discount: "-50%",
    tag: "Deportes",
    location: "Valencia",
    tienda: "SportZone",
    lat: 39.4699,
    lng: -0.3763,
    imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400",
  },
  {
    id: 4,
    title: "Robot de Cocina Cecotec",
    description: "Multifunción 1500W con accesorios incluidos",
    price: 89.00,
    oldPrice: 199.00,
    discount: "-55%",
    tag: "Hogar",
    location: "Sevilla",
    tienda: "MediaMarkt",
    lat: 37.3891,
    lng: -5.9845,
    imagen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400",
  },
  {
    id: 5,
    title: "Auriculares Sony WH-1000XM5",
    description: "Cancelación de ruido activa, 30h batería",
    price: 199.00,
    oldPrice: 380.00,
    discount: "-48%",
    tag: "Electrónica",
    location: "Bilbao",
    tienda: "El Corte Inglés",
    lat: 43.2630,
    lng: -2.9350,
    imagen: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
  },
  {
    id: 6,
    title: "Chaqueta Invierno Zara Man",
    description: "Tallas S-XXL, varios colores, impermeable",
    price: 39.95,
    oldPrice: 89.95,
    discount: "-56%",
    tag: "Moda",
    location: "Zaragoza",
    tienda: "Zara",
    lat: 41.6488,
    lng: -0.8891,
    imagen: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400",
  },
  {
    id: 7,
    title: "Bicicleta Eléctrica Decathlon",
    description: "250W, autonomía 70km, frenos hidráulicos",
    price: 699.00,
    oldPrice: 1199.00,
    discount: "-42%",
    tag: "Deportes",
    location: "Málaga",
    tienda: "Decathlon",
    lat: 36.7213,
    lng: -4.4214,
    imagen: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=400",
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapaChollos() {
  const navigate  = useNavigate();
  const [position, setPosition] = useState(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRegion,   setSelectedRegion]   = useState("");
  const [priceMin,         setPriceMin]          = useState(0);
  const [priceMax,         setPriceMax]          = useState(1000);
  const [orderBy,          setOrderBy]           = useState("recent");
  const [filteredDeals,    setFilteredDeals]     = useState(deals);

  // Obtener ubicación del usuario al cargar
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

  if (!position) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Typography>Cargando mapa...</Typography>
      </Box>
    );
  }

  // ── Aplicar filtros ──────────────────────────────────────────────────────────
  const applyFilters = () => {
    let results = [...deals];
    if (selectedCategory) results = results.filter(d => d.tag      === selectedCategory);
    if (selectedRegion)   results = results.filter(d => d.location === selectedRegion);
    results = results.filter(d => d.price >= priceMin && d.price <= priceMax);
    if (orderBy === "priceLow")  results.sort((a, b) => a.price - b.price);
    if (orderBy === "priceHigh") results.sort((a, b) => b.price - a.price);
    if (orderBy === "discount")  results.sort((a, b) => parseInt(b.discount) - parseInt(a.discount));
    setFilteredDeals(results);
  };

  const resetFilters = () => {
    setSelectedCategory(""); setSelectedRegion("");
    setPriceMin(0); setPriceMax(1000); setOrderBy("recent");
    setFilteredDeals(deals);
  };

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

        {/* Contador de resultados */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredDeals.length} chollos en el mapa
        </Typography>

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Categoría</Typography>
        <RadioGroup value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          {categories.map(cat => (
            <FormControlLabel key={cat} value={cat} control={<Radio size="small" />} label={cat} />
          ))}
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Precio</Typography>
        <Slider
          value={[priceMin, priceMax]}
          onChange={(e, val) => { setPriceMin(val[0]); setPriceMax(val[1]); }}
          valueLabelDisplay="auto"
          min={0} max={1000}
          sx={{ mb: 1, color: "#e53935" }}
        />
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField label="Mín" size="small" type="number" value={priceMin}
            onChange={e => setPriceMin(Number(e.target.value))} fullWidth />
          <TextField label="Máx" size="small" type="number" value={priceMax}
            onChange={e => setPriceMax(Number(e.target.value))} fullWidth />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Ciudad</Typography>
        <Select fullWidth size="small" value={selectedRegion}
          onChange={e => setSelectedRegion(e.target.value)} displayEmpty>
          <MenuItem value=""><em>Todas las ciudades</em></MenuItem>
          {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </Select>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Ordenar por</Typography>
        <Select fullWidth size="small" value={orderBy} onChange={e => setOrderBy(e.target.value)}>
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

        {/* Lista rápida de resultados */}
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontWeight: "bold", mb: 1, fontSize: 14 }}>Chollos en mapa</Typography>
        <Stack spacing={1}>
          {filteredDeals.map(deal => (
            <Paper
              key={deal.id}
              elevation={0}
              onClick={() => navigate(`/chollo/${deal.id}`)}
              sx={{
                p: 1.2, border: "1px solid #eee", borderRadius: 2,
                cursor: "pointer", "&:hover": { bgcolor: "#fff5f5", borderColor: "#e53935" },
              }}
            >
              <Typography variant="body2" fontWeight="bold" noWrap>{deal.title}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="error" fontWeight="bold">{deal.price}€</Typography>
                <Chip label={deal.discount} size="small"
                  sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 10, height: 18 }} />
                <Typography variant="caption" color="text.secondary">{deal.location}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* ── MAPA ── */}
      <Box sx={{ flexGrow: 1 }}>
        <MapContainer
          center={[40.2, -3.5]} // centro de España para ver todos los markers
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

          {/* 🔥 Marcador por cada CHOLLO filtrado */}
          {filteredDeals.map(deal => (
            <Marker
              key={deal.id}
              position={[deal.lat, deal.lng]}
              icon={crearIconoChollo(deal.price)}
            >
              <Popup minWidth={240}>
                {/* Imagen */}
                <Box
                  component="img"
                  src={deal.imagen}
                  alt={deal.title}
                  sx={{
                    width: "100%", height: 120,
                    objectFit: "cover", borderRadius: 1,
                    display: "block", mb: 1,
                  }}
                />

                {/* Info */}
                <Typography fontWeight="bold" fontSize={13} gutterBottom>
                  {deal.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {deal.description}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography fontWeight="bold" color="error" fontSize={16}>
                    {deal.price}€
                  </Typography>
                  <Typography sx={{ textDecoration: "line-through", color: "gray", fontSize: 12 }}>
                    {deal.oldPrice}€
                  </Typography>
                  <Chip
                    label={deal.discount}
                    size="small"
                    sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 11 }}
                  />
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }} flexWrap="wrap">
                  <Chip label={deal.tag}      size="small" variant="outlined" />
                  <Chip label={deal.location} size="small" variant="outlined" />
                  <Chip label={deal.tienda}   size="small" variant="outlined" />
                </Stack>

                {/* Botón para ir al detalle */}
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