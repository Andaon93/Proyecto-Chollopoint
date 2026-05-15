import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, Box, Button,
  TextField, Container, Stack, Avatar, Tooltip,
  IconButton, Drawer, List, ListItem, ListItemButton,
  ListItemText, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function irA(ruta) {
    navigate(ruta);
    setMenuAbierto(false);
  }

  return (
    <AppBar position="static" sx={{ background: "linear-gradient(90deg, #e53935, #ff7043)" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box component={Link} to="/" sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "inherit" }}>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ height: { xs: 60, md: 100 } }} />
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>Chollopoint</Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
          <Button variant="contained" onClick={() => navigate("/mi-ubicacion")}
            sx={{ bgcolor: "white", color: "#e53935", fontWeight: "bold", "&:hover": { bgcolor: "#f5f5f5" } }}>
            Mi ubicación
          </Button>

          {usuario && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/publicar")}
              sx={{ bgcolor: "#ff7043", color: "white", fontWeight: "bold", border: "2px solid white", "&:hover": { bgcolor: "#f4511e" } }}>
              Publicar chollo
            </Button>
          )}

          {usuario ? (
            <Tooltip title={`Hola, ${usuario.nombre}`} arrow>
              <Avatar onClick={() => navigate("/perfil")}
                sx={{ bgcolor: "white", color: "#e53935", fontWeight: "bold", cursor: "pointer", width: 42, height: 42, "&:hover": { opacity: 0.85 } }}>
                {usuario.avatar}
              </Avatar>
            </Tooltip>
          ) : (
            <Button component={Link} to="/login" variant="outlined"
              sx={{ color: "white", borderColor: "white", fontWeight: "bold", "&:hover": { borderColor: "#f5f5f5", bgcolor: "rgba(255,255,255,0.1)" } }}>
              Login
            </Button>
          )}
        </Stack>

        <IconButton onClick={() => setMenuAbierto(true)} sx={{ display: { xs: "flex", md: "none" }, color: "white" }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {location.pathname !== "/login" && (
        <Container sx={{ mt: 1, mb: 0.5 }}>
          <TextField fullWidth placeholder="Buscar chollos, tiendas, productos..." variant="outlined" sx={{ bgcolor: "white", borderRadius: 2 }} />
        </Container>
      )}

      <Drawer anchor="right" open={menuAbierto} onClose={() => setMenuAbierto(false)}>
        <Box sx={{ width: 260, p: 2, bgcolor: "#e53935", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight="bold">Menú</Typography>
          <IconButton onClick={() => setMenuAbierto(false)} sx={{ color: "white" }}><CloseIcon /></IconButton>
        </Box>

        {usuario && (
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff5f5" }}>
            <Avatar sx={{ bgcolor: "#e53935", color: "white", fontWeight: "bold" }}>{usuario.avatar}</Avatar>
            <Box>
              <Typography fontWeight="bold" fontSize={14}>{usuario.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">{usuario.email}</Typography>
            </Box>
          </Box>
        )}

        <Divider />

        <List sx={{ pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => irA("/")}><ListItemText primary="🏠 Inicio" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => irA("/mi-ubicacion")}><ListItemText primary="📍 Mi ubicación" /></ListItemButton>
          </ListItem>

          {usuario && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => irA("/publicar")}><ListItemText primary="➕ Publicar chollo" /></ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => irA("/perfil")}><ListItemText primary="👤 Mi perfil" /></ListItemButton>
              </ListItem>
            </>
          )}

          {!usuario && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => irA("/login")}><ListItemText primary="🔑 Iniciar sesión" /></ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => irA("/registro")}><ListItemText primary="📝 Crear cuenta" /></ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </AppBar>
  );
}