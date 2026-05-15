# CholloPoint — Backend PHP

API REST en PHP puro (sin frameworks) con MySQL para la app React de CholloPoint.

---

## Estructura de archivos

```
chollopoint-backend/
├── index.php                  ← Router / Front Controller
├── .htaccess                  ← Reescritura de URLs (Apache)
├── database.sql               ← Esquema de BD + datos de ejemplo
├── client.js                  ← Cliente JS para el frontend React
│
├── config/
│   └── database.php           ← Conexión PDO
│
├── helpers/
│   ├── jwt.php                ← Generación/verificación de JWT (HS256)
│   └── response.php           ← Helpers JSON y validación
│
├── middleware/
│   └── auth.php               ← autenticar() / autenticarOpcional()
│
└── controllers/
    ├── AuthController.php     ← Registro, login, /me
    ├── UsuariosController.php ← Perfil, puntos
    ├── ChollosController.php  ← CRUD + votar
    ├── ComentariosController.php
    └── FavoritosController.php
```

---

## Requisitos

| Requisito | Versión mínima |
|-----------|---------------|
| PHP       | 8.1           |
| MySQL     | 5.7 / 8.0     |
| Apache    | 2.4 (con mod_rewrite) |

También funciona con **Nginx** (ver configuración más abajo) o con el servidor integrado de PHP para desarrollo.

---

## Instalación paso a paso

### 1. Base de datos

```bash
# Entra a MySQL
mysql -u root -p

# Ejecuta el esquema
SOURCE /ruta/a/chollopoint-backend/database.sql;
```

O desde la línea de comandos:

```bash
mysql -u root -p < database.sql
```

### 2. Configuración

Edita `config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'chollopoint');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');
```

Edita `helpers/jwt.php` y cambia el secreto:

```php
define('JWT_SECRET', 'pon-aqui-una-clave-muy-larga-y-aleatoria-de-al-menos-32-chars');
```

### 3. Servidor de desarrollo (PHP built-in)

```bash
cd chollopoint-backend
php -S localhost:8000
```

La API estará en `http://localhost:8000`.

### 4. Apache (producción / XAMPP / MAMP)

Copia la carpeta dentro de `htdocs/` (XAMPP) o `/var/www/html/` y asegúrate de que `mod_rewrite` está activado.

```apache
# En tu VirtualHost o en httpd.conf:
<Directory "/var/www/html/chollopoint-backend">
    AllowOverride All
</Directory>
```

### 5. Nginx (producción)

```nginx
location /api/ {
    alias /var/www/html/chollopoint-backend/;
    try_files $uri $uri/ /api/index.php?$query_string;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }
}
```

---

## Integración con el frontend React

### 1. Copia `client.js` a `src/api/client.js` en tu proyecto React.

### 2. Crea un fichero `.env` en la raíz del proyecto React:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Actualiza `AuthContext.jsx`

Reemplaza las funciones `login` y `registro` para usar la API:

```jsx
import api from '../api/client';

// En AuthProvider:
const login = async (email, password) => {
  try {
    const res = await api.login(email, password);
    setUsuario(res.data.usuario);
    guardarEnStorage(res.data.usuario);
    return { ok: true };
  } catch (err) {
    return { ok: false, mensaje: err.message };
  }
};

const registro = async (nombre, email, password) => {
  try {
    const res = await api.registro(nombre, email, password);
    setUsuario(res.data.usuario);
    guardarEnStorage(res.data.usuario);
    return { ok: true };
  } catch (err) {
    return { ok: false, mensaje: err.message };
  }
};
```

### 4. Actualiza `PublicarChollo.jsx`

```jsx
import api from '../api/client';

// En handleSubmit, reemplaza guardarDeal(nuevoDeal) por:
const res = await api.chollos.crear({ ...nuevoDeal, publicado_por: usuario.nombre });
```

---

## Endpoints de la API

### Auth

| Método | Ruta           | Auth | Descripción            |
|--------|----------------|------|------------------------|
| POST   | /auth/registro | ✗    | Crear cuenta           |
| POST   | /auth/login    | ✗    | Iniciar sesión         |
| GET    | /auth/me       | ✓    | Datos del usuario      |

### Chollos

| Método | Ruta                    | Auth | Descripción                        |
|--------|-------------------------|------|------------------------------------|
| GET    | /chollos                | ✗    | Listar con filtros y paginación    |
| GET    | /chollos/{id}           | ✗    | Detalle de un chollo               |
| POST   | /chollos                | ✓    | Crear chollo (+10 puntos)          |
| PUT    | /chollos/{id}           | ✓    | Editar (solo el autor)             |
| DELETE | /chollos/{id}           | ✓    | Eliminar (solo el autor)           |
| POST   | /chollos/{id}/votar     | ✓    | Votar positivo/negativo            |

**Query params de GET /chollos:**
`categoria`, `ciudad`, `precio_min`, `precio_max`, `orden` (recent/priceLow/priceHigh/discount), `pagina`, `por_pagina`, `solo_activos`

### Comentarios

| Método | Ruta                            | Auth | Descripción                |
|--------|---------------------------------|------|----------------------------|
| GET    | /chollos/{id}/comentarios       | ✗    | Listar comentarios         |
| POST   | /chollos/{id}/comentarios       | ✓    | Añadir comentario (+2 pts) |
| DELETE | /comentarios/{id}               | ✓    | Eliminar (solo el autor)   |
| POST   | /comentarios/{id}/votar         | ✓    | Dar like                   |

### Favoritos

| Método | Ruta              | Auth | Descripción              |
|--------|-------------------|------|--------------------------|
| GET    | /favoritos        | ✓    | Mis favoritos            |
| POST   | /favoritos/{id}   | ✓    | Añadir/quitar (toggle)   |

### Usuarios

| Método | Ruta              | Auth | Descripción              |
|--------|-------------------|------|--------------------------|
| GET    | /usuarios/{id}    | ✗    | Ver perfil público       |
| PUT    | /usuarios/me      | ✓    | Editar mi perfil         |
| POST   | /usuarios/puntos  | ✓    | Sumar/restar puntos      |

---

## Sistema de puntos

| Acción                 | Puntos |
|------------------------|--------|
| Publicar un chollo     | +10    |
| Escribir un comentario | +2     |
| Recibir voto positivo  | +1     |
| Los puntos nunca bajan de 0 | — |

---

## Notas de seguridad

- Las contraseñas se almacenan con `password_hash()` (bcrypt, coste 12).
- Los tokens JWT expiran en **7 días**.
- Cambia `JWT_SECRET` antes de desplegar en producción.
- Activa HTTPS en producción para proteger los tokens.
- Revisa la lista de `$allowedOrigins` en `index.php`.
