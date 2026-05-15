import React, { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "chollopoint_usuario";

function guardarEnStorage(usuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
}

function leerDeStorage() {
  try {
    const dato = localStorage.getItem(STORAGE_KEY);
    if (dato) return JSON.parse(dato);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function borrarDeStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("chollopoint_token");
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leerDeStorage());

  async function login(email, password) {
    try {
      const res = await api.login(email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardarEnStorage(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  }

  async function registro(nombre, email, password) {
    try {
      const res = await api.registro(nombre, email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardarEnStorage(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  }

  function actualizarUsuario(nuevosData) {
    const actualizado = { ...usuario, ...nuevosData };
    setUsuario(actualizado);
    guardarEnStorage(actualizado);
  }

  async function sumarPuntos(cantidad) {
    if (!usuario) return;
    try {
      const res = await api.usuario.sumarPuntos(cantidad);
      const usuarioActualizado = { ...usuario, puntos: res.data.puntos };
      setUsuario(usuarioActualizado);
      guardarEnStorage(usuarioActualizado);
    } catch (err) {
      console.error("Error al sumar puntos:", err.message);
    }
  }

  function logout() {
    setUsuario(null);
    borrarDeStorage();
  }

  function sesionExpirada() {
    setUsuario(null);
    borrarDeStorage();
  }

  return (
    <AuthContext.Provider value={{ usuario, login, registro, logout, sesionExpirada, sumarPuntos, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}