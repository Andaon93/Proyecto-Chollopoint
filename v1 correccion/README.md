# CholloPoint — Frontend React

SPA (Single Page Application) con React 18, Material UI y Leaflet para la app de chollos geolocalizados.

---

## Estructura de archivos

```
chollopoint-frontend/
├── index.html                 ← Punto de entrada HTML
├── vite.config.js             ← Configuración de Vite (build tool)
├── .env                        ← Variables de entorno (no subir a git)
├── package.json               ← Dependencias y scripts
│
├── public/
│   └── logo.png               ← Logo de CholloPoint
│
└── src/
    ├── main.jsx               ← Punto de entrada React
    ├── App.jsx                ← Componente principal con rutas
    ├── index.css              ← Estilos globales
    │
    ├── context/
    │   └── AuthContext.jsx    ← Context para autenticación global (usuario, token, login, logout)
    │
    ├── api/
    │   └── client.js          ← Cliente HTTP centralizado con Axios + interceptores JWT
    │
    ├── hooks/
    │   └── useAuth.js         ← Custom hook para acceder a AuthContext
    │
    ├── pages/
    │   ├── Home.jsx           ← Página principal con listado de chollos
    │   ├── Mapa.jsx           ← Vista mapa con Leaflet + OpenStreetMap + filtros
    │   ├── PublicarChollo.jsx ← Formulario para publicar un chollo (con preview en tiempo real)
    │   ├── DetalleChollo.jsx  ← Página de detalle de un chollo + comentarios
    │   ├── Perfil.jsx         ← Perfil del usuario + estadísticas + badges
    │   ├── Login.jsx          ← Formulario de login
    │   ├── Registro.jsx       ← Formulario de registro con validación cliente
    │   └── NotFound.jsx       ← Página 404
    │
    ├── components/
    │   ├── Navbar.jsx         ← Barra de navegación (responsiva)
    │   ├── TarjetaChollo.jsx  ← Componente Card para mostrar cada chollo
    │   ├── Filtros.jsx        ← Panel de filtros (categoría, precio, provincia, orden)
    │   ├── ComentariosSection.jsx ← Sección de comentarios + formulario
    │   ├── PrivateRoute.jsx   ← HOC para proteger rutas autenticadas
    │   ├── Loading.jsx        ← Spinner de carga
    │   └── Badge.jsx          ← Componente para mostrar badges de gamificación
    │
    └── utils/
        ├── validators.js      ← Funciones de validación (email, contraseña, etc)
        ├── formats.js         ← Formateo de fechas, precios, porcentajes
        └── constants.js       ← Constantes globales (categorías, provincias, etc)
```

---

## Requisitos

| Requisito | Versión mínima |
|-----------|----------------|
| Node.js   | 16.x           |
| npm       | 8.x            |
| React     | 18.x           |
| Vite      | 5.x            |

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/Andaon93/Proyecto-Chollopoint.git
cd Proyecto-Chollopoint
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
```

Para producción (Netlify, Vercel, etc):

```env
VITE_API_URL=https://proyecto-chollopoint.onrender.com
```

### 4. Servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador.

### 5. Build para producción

```bash
npm run build
```

Genera la carpeta `/dist` lista para desplegar.

---

## Scripts disponibles

| Comando        | Descripción                              |
|----------------|------------------------------------------|
| `npm run dev`  | Inicia servidor de desarrollo con HMR    |
| `npm run build`| Compila para producción (optimizado)     |
| `npm run preview` | Previsualiza la build en local          |
| `npm run lint` | Verifica la sintaxis con ESLint (opcional)|

---

## Dependencias principales

### Tecnologías core

```json
{
  "react": "^18.2.0",           // Framework UI
  "react-dom": "^18.2.0",       // Renderizado DOM
  "react-router-dom": "^6.x",   // Enrutado SPA
  "vite": "^5.x"                // Build tool ultra rápido
}
```

### UI y estilos

```json
{
  "@mui/material": "^5.x",      // Material Design components
  "@mui/icons-material": "^5.x" // Iconos Material
}
```

### Mapas e integración

```json
{
  "leaflet": "^1.9.x",          // Librería de mapas
  "react-leaflet": "^4.x",      // Binding React para Leaflet
  "axios": "^1.x"               // Cliente HTTP
}
```

---

## Características principales

### 🔐 Autenticación

- Login y registro con validación cliente
- JWT token almacenado en localStorage
- AuthContext para gestión global de sesión
- Private routes protegidas con PrivateRoute

### 🗺️ Mapa interactivo

- Leaflet + OpenStreetMap
- Marcadores dinámicos con precio
- Geolocalización del navegador (navigator.geolocation)
- Popup interactivo al hacer clic en marcador

### 🏷️ Filtros y búsqueda

- Filtro por categoría (select)
- Rango de precio (slider)
- Filtro por provincia
- Ordenación (reciente, precio menor, precio mayor, descuento)
- Aplicados en cliente sobre datos cargados

### 📝 Publicación de chollos

- Formulario con validación
- Preview en tiempo real de cómo quedará el chollo
- Cálculo automático del descuento porcentual
- Geolocalización automática opcional

### 💬 Comentarios y votos

- Comentarios en cada chollo
- Votos positivos/negativos en chollos y comentarios
- Ordenación por más votados
- Validación de comentarios vacíos

### 🎮 Gamificación

- Sistema de puntos (+10 publicar, +2 comentar, +1 voto recibido)
- Badges desbloqueables ("Primer chollo", "Comentarista", "Validador", etc)
- Niveles basados en puntos (Novato, Avanzado, Experto, Maestro)
- Vista de perfil con estadísticas

### 📱 Responsive Design

- Material UI Breakpoints (xs, sm, md, lg)
- Navbar adaptativo con menú mobile
- Cards y grillas responsivas
- Totalmente mobile-friendly

### ⏱️ Expiración automática

- Función `estaExpirado()` que compara expiraEn con Date.now()
- Cards expiradas desaturadas y sin interacción
- Mensaje visual de "Expirado hace X horas"

---

## Flujo de datos

```
Usuario en interfaz
        ↓
Evento (click, submit)
        ↓
Component (ej: PublicarChollo.jsx)
        ↓
API Client (api/client.js)
        ↓
Backend REST (PHP)
        ↓
Base de datos MySQL
        ↓
Respuesta JSON
        ↓
Actualizar estado (setState)
        ↓
Renderizar UI actualizada
```

---

## Integración con el backend

El frontend se conecta al backend a través de `src/api/client.js`:

```javascript
// Ejemplo: crear un chollo
import api from '../api/client';

const respuesta = await api.chollos.crear({
  titulo: 'PlayStation 5',
  descripcion: '...',
  precio_original: 499,
  precio_oferta: 399,
  tienda: 'Game Store',
  categoria: 'Electrónica',
  latitud: 37.389,
  longitud: -5.984
});

if (respuesta.ok) {
  console.log('Chollo creado:', respuesta.data);
}
```

Todos los endpoints están documentados en el README del backend.

---

## Variables de estado importantes

### AuthContext

```javascript
{
  usuario: {
    id: 1,
    nombre: 'Fernando',
    email: 'f@gmail.com',
    alias: 'dfsdf',
    puntos: 45,
    rol: 'admin'
  },
  token: 'eyJhbGciOiJIUzI1NiIs...',
  logueado: true
}
```

### Home.jsx

```javascript
{
  chollos: [],           // Array de todos los chollos
  filtrados: [],         // Chollos después de aplicar filtros
  filtros: {
    categoria: '',
    precioMin: 0,
    precioMax: 10000,
    provincia: '',
    orden: 'recent'
  },
  cargando: false,
  error: null
}
```

---

## Notas de desarrollo

### Hot Module Replacement (HMR)

Vite proporciona recarga rápida en desarrollo. Edita cualquier archivo y verás los cambios al instante.

### localStorage

El token JWT se almacena en localStorage bajo la clave `chollopoint_token`. Se carga automáticamente al recargar la página.

### CORS

El backend debe permitir requests desde `http://localhost:5173` en desarrollo y desde `https://gilded-gaufre-e2d152.netlify.app` en producción.

### Performance

- Code splitting automático por rutas
- Lazy loading de componentes con React.lazy
- Imágenes optimizadas con srcSet
- CSS minimizado en build

---

## Despliegue en Netlify

### 1. Push a GitHub

```bash
git add .
git commit -m "Deploy a Netlify"
git push origin main
```

### 2. Conectar Netlify

- Ve a https://netlify.com
- Conecta tu repo de GitHub
- Build command: `npm run build`
- Publish directory: `dist`
- Add build environment variable: `VITE_API_URL` = tu URL del backend en Render

### 3. Deploy

Netlify auto-deployará cada push a main.

---

## Solución de problemas

### "Cannot find module 'react'"

```bash
npm install
```

### "CORS error" al conectar con backend

Verifica que:
1. El backend está corriendo
2. `VITE_API_URL` apunta a la URL correcta del backend
3. El backend permite CORS desde tu frontend (revisa `index.php`)

### "Token expirado"

El token caduca en 7 días. Haz logout y vuelve a login para obtener uno nuevo.

### Mapa no carga en Leaflet

Verifica que OpenStreetMap está accesible y que no hay problemas de CORS.

---

## Notas de seguridad

- **Nunca** subas el archivo `.env` a git (está en `.gitignore`)
- El token JWT se envía en el header `Authorization: Bearer <token>`
- Las contraseñas se envían por HTTPS en producción
- Las credenciales nunca se guardan en localStorage, solo el token

---

## Contacto y soporte

**Proyecto:** CholloPoint — Red social de ofertas geolocalizadas  
**Autor:** Fernando (Andaon93)  
**GitHub:** https://github.com/Andaon93/Proyecto-Chollopoint  
**Deploy:** https://gilded-gaufre-e2d152.netlify.app  

---

**Último update:** Mayo 2026  
**Versión:** 1.0.0
