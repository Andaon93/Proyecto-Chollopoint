import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";

// Contexto de autenticación para saber si el usuario está logueado
import { AuthProvider } from "./context/AuthContext";

// Layout general
import Navbar from "./components/Navbar";

// Páginas de la app
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import MapaChollos from "./pages/MapaChollos";
import DetalleChollo from "./pages/DetalleChollo";
import PublicarChollo from "./pages/PublicarChollo";
import EditarChollo from "./pages/EditarChollo";

// Color de fondo general de la app
const BG_COLOR = "#f5f5f5";

function App() {
  return (
    <AuthProvider>
      {/* Resetea los estilos del navegador para que todo se vea igual */}
      <CssBaseline />

      <BrowserRouter>
        {/* La barra de navegación se muestra en todas las páginas */}
        <Navbar />

        <Box sx={{ backgroundColor: BG_COLOR, minHeight: "100vh" }}>
          <Routes>
            {/* Página principal con todos los chollos */}
            <Route path="/" element={<Home />} />

            {/* Detalle de un chollo concreto */}
            <Route path="/chollo/:id" element={<DetalleChollo />} />

            {/* Mapa con chollos cercanos */}
            <Route path="/mi-ubicacion" element={<MapaChollos />} />

            {/* Publicar o editar un chollo */}
            <Route path="/publicar" element={<PublicarChollo />} />
            <Route path="/editar/:id" element={<EditarChollo />} />

            {/* Perfil del usuario */}
            <Route path="/perfil" element={<Perfil />} />

            {/* Autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;