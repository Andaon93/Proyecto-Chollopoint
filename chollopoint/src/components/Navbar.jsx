// 📄 Navbar.jsx (actualizado)
// Cambio: se añade el botón "Publicar chollo" junto a "Mi ubicación".

import React from "react";
import {
  AppBar, Toolbar, Typography, Box, Button,
  TextField, Container, Stack, Avatar, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { usuario } = useAuth();

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(90deg, #e53935, #ff7043)",
        
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

        {/* Logo */}
        <Box
          component={Link} to="/"
          sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "inherit" }}
        >
          <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 100 }} />
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>Chollopoint</Typography>
        </Box>

        {/* Botones */}
        <Stack direction="row" spacing={2} alignItems="center">

          <Button
            variant="contained"
            onClick={() => navigate("/mi-ubicacion")}
            sx={{ bgcolor: "white", color: "#e53935", fontWeight: "bold", "&:hover": { bgcolor: "#f5f5f5" } }}
          >
            Mi ubicación
          </Button>

          {/* Botón publicar — solo visible si hay usuario logueado */}
          {usuario && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/publicar")}
              sx={{
                bgcolor: "#ff7043", color: "white", fontWeight: "bold",
                border: "2px solid white",
                "&:hover": { bgcolor: "#f4511e" },
              }}
            >
              Publicar chollo
            </Button>
          )}

          {usuario ? (
            <Tooltip title={`Hola, ${usuario.nombre}`} arrow>
              <Avatar
                onClick={() => navigate("/perfil")}
                sx={{
                  bgcolor: "white", color: "#e53935", fontWeight: "bold",
                  cursor: "pointer", width: 42, height: 42,
                  "&:hover": { opacity: 0.85 },
                }}
              >
                {usuario.avatar}
              </Avatar>
            </Tooltip>
          ) : (
            <Button
              component={Link} to="/login"
              variant="outlined"
              sx={{
                color: "white", borderColor: "white", fontWeight: "bold",
                "&:hover": { borderColor: "#f5f5f5", bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              Login
            </Button>
          )}
        </Stack>
      </Toolbar>

      {location.pathname !== "/login" && (
        <Container sx={{ mt: 1, mb: 0.5 }}>
          <TextField
            fullWidth
            placeholder="Buscar chollos, tiendas, productos..."
            variant="outlined"
            sx={{ bgcolor: "white", borderRadius: 2 }}
          />
        </Container>
      )}
    </AppBar>
  );
}