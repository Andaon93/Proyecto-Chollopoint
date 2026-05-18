import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container, Box, TextField, Button,
  Typography, Paper, Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const resultado = await login(email, password);
    if (resultado.ok) {
      navigate("/perfil");
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #f5f5f5, #e0e0e0)" }}>
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 5, borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.2)" }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
            Iniciar Sesión
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}


          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Correo" type="email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField fullWidth label="Contraseña" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button fullWidth type="submit" variant="contained" sx={{ mt: 3, py: 1.5, fontWeight: "bold", background: "linear-gradient(90deg, #e53935, #ff7043)", "&:hover": { background: "linear-gradient(90deg, #d32f2f, #f4511e)" } }}>
              Entrar
            </Button>
          </Box>

          <Typography align="center" sx={{ mt: 2, color: "text.secondary" }}>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" style={{ color: "#e53935", fontWeight: "bold" }}>Crear una cuenta</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
