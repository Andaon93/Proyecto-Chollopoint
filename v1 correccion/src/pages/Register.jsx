import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container, Box, TextField, Button,
  Typography, Paper, Alert, InputAdornment, IconButton,
  Divider, LinearProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { useAuth } from "../context/AuthContext";

function calcularFuerza(pwd) {
  if (!pwd) return { valor: 0, texto: "", color: "error" };

  let pts = 0;
  if (pwd.length >= 6) pts++;
  if (pwd.length >= 10) pts++;
  if (/[A-Z]/.test(pwd)) pts++;
  if (/[0-9]/.test(pwd)) pts++;
  if (/[^A-Za-z0-9]/.test(pwd)) pts++;

  if (pts <= 1) return { valor: 20, texto: "Muy débil", color: "error" };
  if (pts === 2) return { valor: 40, texto: "Débil", color: "error" };
  if (pts === 3) return { valor: 60, texto: "Media", color: "warning" };
  if (pts === 4) return { valor: 80, texto: "Fuerte", color: "success" };
  return { valor: 100, texto: "Muy fuerte", color: "success" };
}

export default function Register() {
  const navigate = useNavigate();
  const { registro } = useAuth();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  const fuerza = calcularFuerza(password);

  function validar() {
    const e = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Introduce un correo válido";
    if (password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres";
    if (password !== confirmar) e.confirmar = "Las contraseñas no coinciden";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = validar();
    if (Object.keys(errs).length > 0) { setErrores(errs); return; }
    setErrores({});
    const resultado = await registro(nombre, email, password);
    if (resultado.ok) {
      navigate("/perfil");
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #f5f5f5, #e0e0e0)", py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 5, borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.15)" }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <HowToRegIcon sx={{ fontSize: 48, color: "#e53935", mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>Crear cuenta</Typography>
            <Typography color="text.secondary">Únete a la comunidad de cazachollos</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

          <Alert severity="info" sx={{ mb: 3 }}>
            Al registrarte empezarás con <strong>0 puntos</strong> como Novato 🌱.
            Publica chollos (+10), comenta (+2) y recibe votos positivos (+1) para subir de nivel.
          </Alert>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Nombre completo *" margin="normal" value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrores(p => ({ ...p, nombre: "" })); }}
              error={!!errores.nombre} helperText={errores.nombre}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: "text.secondary" }} /></InputAdornment> }}
            />

            <TextField fullWidth label="Correo electrónico *" type="email" margin="normal" value={email}
              onChange={(e) => { setEmail(e.target.value); setErrores(p => ({ ...p, email: "" })); }}
              error={!!errores.email} helperText={errores.email}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: "text.secondary" }} /></InputAdornment> }}
            />

            <TextField fullWidth label="Contraseña *" type={verPassword ? "text" : "password"} margin="normal" value={password}
              onChange={(e) => { setPassword(e.target.value); setErrores(p => ({ ...p, password: "" })); }}
              error={!!errores.password} helperText={errores.password || "Mínimo 6 caracteres"}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setVerPassword(!verPassword)} edge="end">{verPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>,
              }}
            />

            {password && (
              <Box sx={{ mt: 0.5, mb: 1 }}>
                <LinearProgress variant="determinate" value={fuerza.valor} color={fuerza.color} sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="caption" color={`${fuerza.color}.main`}>Contraseña {fuerza.texto}</Typography>
              </Box>
            )}

            <TextField fullWidth label="Confirmar contraseña *" type={verConfirmar ? "text" : "password"} margin="normal" value={confirmar}
              onChange={(e) => { setConfirmar(e.target.value); setErrores(p => ({ ...p, confirmar: "" })); }}
              error={!!errores.confirmar} helperText={errores.confirmar}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setVerConfirmar(!verConfirmar)} edge="end">{verConfirmar ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>,
              }}
            />

            <Button fullWidth type="submit" variant="contained" size="large" startIcon={<HowToRegIcon />}
              sx={{ mt: 3, py: 1.5, fontWeight: "bold", background: "linear-gradient(90deg, #e53935, #ff7043)", "&:hover": { background: "linear-gradient(90deg, #d32f2f, #f4511e)" } }}>
              Crear cuenta
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography align="center" color="text.secondary">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" style={{ color: "#e53935", fontWeight: "bold" }}>Iniciar sesión</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}