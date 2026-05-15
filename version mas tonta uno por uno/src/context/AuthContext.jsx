// 📦 AuthContext.jsx — conectado a la API PHP
import React, { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "chollopoint_usuario";

const guardarEnStorage = (usuario) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
};

const leerDeStorage = () => {
  try {
    const dato = localStorage.getItem(STORAGE_KEY);
    return dato ? JSON.parse(dato) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const borrarDeStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("chollopoint_token");
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leerDeStorage());

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardarEnStorage(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  };

  // ── REGISTRO ─────────────────────────────────────────────────────────────
  const registro = async (nombre, email, password) => {
    try {
      const res = await api.registro(nombre, email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardarEnStorage(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  };

  // ── ACTUALIZAR USUARIO (tras editar perfil) ───────────────────────────────
  const actualizarUsuario = (nuevosData) => {
    const actualizado = { ...usuario, ...nuevosData };
    setUsuario(actualizado);
    guardarEnStorage(actualizado);
  };

  // ── SUMAR PUNTOS ─────────────────────────────────────────────────────────
  const sumarPuntos = async (cantidad) => {
    if (!usuario) return;
    try {
      const res = await api.usuario.sumarPuntos(cantidad);
      const usuarioActualizado = { ...usuario, puntos: res.data.puntos };
      setUsuario(usuarioActualizado);
      guardarEnStorage(usuarioActualizado);
    } catch (err) {
      console.error("Error al sumar puntos:", err.message);
    }
  };

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = () => {
    setUsuario(null);
    borrarDeStorage();
  };

  return (
    <AuthContext.Provider value={{ usuario, login, registro, logout, sumarPuntos, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}