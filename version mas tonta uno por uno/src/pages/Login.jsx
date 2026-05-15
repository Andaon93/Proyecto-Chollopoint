// 📄 Login.jsx
// Formulario de inicio de sesión.
// Usa el contexto de autenticación para hacer el login
// y redirige al perfil si las credenciales son correctas.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container, Box, TextField, Button,
  Typography, Paper, Alert,
} from "@mui/material";

import { useAuth } from "../context/AuthContext";

function Login() {
  // Campos del formulario
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Mensaje de error si el login falla
  const [error, setError] = useState("");

  // Sacamos la función login del contexto de autenticación
  const { login } = useAuth();
  const navigate  = useNavigate();

  /**
   * Gestiona el envío del formulario de login
   * @param {React.FormEvent} e - Evento del formulario
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Llamamos al login del contexto con las credenciales introducidas
    const resultado = await login(email, password);

    if (resultado.ok) {
      // Si el login es correcto redirigimos al perfil
      navigate("/perfil");
    } else {
      // Si hay error lo mostramos en pantalla
      setError(resultado.mensaje);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f5f5, #e0e0e0)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{ p: 5, borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.2)" }}
        >
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
            Iniciar Sesión
          </Typography>

          {/* Mensaje de error si las credenciales son incorrectas */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Usuarios de prueba para facilitar las pruebas */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Usuarios de prueba:</strong><br />
            carlos@ejemplo.com / 1234<br />
            ana@ejemplo.com / 1234
          </Alert>

          {/* Formulario de login */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo"
              type="email"
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{
                mt: 3, py: 1.5, fontWeight: "bold",
                background: "linear-gradient(90deg, #e53935, #ff7043)",
                "&:hover": { background: "linear-gradient(90deg, #d32f2f, #f4511e)" },
              }}
            >
              Entrar
            </Button>
          </Box>

          {/* Enlace para ir al registro si no tiene cuenta */}
          <Typography align="center" sx={{ mt: 2, color: "text.secondary" }}>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" style={{ color: "#e53935", fontWeight: "bold" }}>
              Crear una cuenta
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;