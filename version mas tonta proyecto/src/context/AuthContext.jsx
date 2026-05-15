import React, { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const CLAVE = "chollopoint_usuario";

const guardar = (usuario) => {
  localStorage.setItem(CLAVE, JSON.stringify(usuario));
};

const leer = () => {
  try {
    const dato = localStorage.getItem(CLAVE);
    return dato ? JSON.parse(dato) : null;
  } catch {
    localStorage.removeItem(CLAVE);
    return null;
  }
};

const borrar = () => {
  localStorage.removeItem(CLAVE);
  localStorage.removeItem("chollopoint_token");
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => leer());

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardar(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  };

  const registro = async (nombre, email, password) => {
    try {
      const res = await api.registro(nombre, email, password);
      const u = res.data.usuario;
      setUsuario(u);
      guardar(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.message };
    }
  };

  // para actualizar datos del perfil sin cerrar sesión
  const actualizarUsuario = (datos) => {
    const nuevo = { ...usuario, ...datos };
    setUsuario(nuevo);
    guardar(nuevo);
  };

  const sumarPuntos = async (cantidad) => {
    if (!usuario) return;
    try {
      const res = await api.usuario.sumarPuntos(cantidad);
      const actualizado = { ...usuario, puntos: res.data.puntos };
      setUsuario(actualizado);
      guardar(actualizado);
    } catch (err) {
      console.error("Error al sumar puntos:", err.message);
    }
  };

  const logout = () => {
    setUsuario(null);
    borrar();
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