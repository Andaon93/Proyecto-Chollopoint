import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";

import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import DetalleChollo from "./pages/DetalleChollo";
import Login from "./pages/Login";
import MapaChollos from "./pages/MapaChollos";
import Perfil from "./pages/Perfil";
import PublicarChollo from "./pages/PublicarChollo";
import EditarChollo from "./pages/EditarChollo";
import Register from "./pages/Register";

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Router>
        <Navbar />
        <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chollo/:id" element={<DetalleChollo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mi-ubicacion" element={<MapaChollos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/publicar" element={<PublicarChollo />} />
            <Route path="/editar/:id" element={<EditarChollo />} />
            <Route path="/registro" element={<Register />} />
          </Routes>
        </Box>
      </Router>
    </AuthProvider>
  );
}

export default App;