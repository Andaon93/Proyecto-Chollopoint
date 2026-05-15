# CholloPoint — Backend PHP

API REST en PHP puro (sin frameworks) con MySQL para la app React de CholloPoint.

---

## Estructura de archivos

```
chollopoint-backend/
├── index.php                  ← Router: decide qué controlador responde a cada petición
├── .htaccess                  ← Reescritura de URLs para Apache
├── database.sql               ← Esquema de la base de datos + datos de ejemplo
├── client.js                  ← Cliente JS para conectar el frontend React con la API
│
├── config/
│   └── database.php           ← Conexión a MySQL con PDO (función conexionBaseDatos)
│
├── helpers/
│   ├── jwt.php                ← Crear y verificar tokens de sesión (generarTokenSesion / verificarTokenSesion)
│   └── response.php           ← Enviar respuestas JSON al frontend (responderExito / responderError)
│
├── middleware/
│   └── auth.php               ← Comprobar si el usuario está logueado (comprobarSesionActiva / comprobarSesionOpcional)
│
└── controllers/
    ├── AuthController.php     ← Registro, login, /me
    ├── UsuariosController.php ← Ver perfil, editar perfil, actualizar puntos
    ├── ChollosController.php  ← Listar, ver, crear, editar, eliminar y votar chollos
    ├── ComentariosController.php ← Comentarios y votos en comentarios
    └── FavoritosController.php   ← Guardar y quitar chollos de favoritos
```

---

## Requisitos

| Requisito | Versión mínima |
|-----------|----------------|
| PHP       | 8.1            |
| MySQL     | 5.7 / 8.0      |
| Apache    | 2.4 (con mod_rewrite activado) |

También funciona con **Nginx** (ver configuración más abajo) o con el servidor integrado de PHP para desarrollo rápido.

---

## Instalación paso a paso

### 1. Base de datos

```bash
# Entra a MySQL
mysql -u root -p

# Ejecuta el esquema completo
SOURCE /ruta/a/chollopoint-backend/database.sql;
```

O directamente desde la línea de comandos:

```bash
mysql -u root -p < database.sql
```

### 2. Configuración

Edita `config/database.php` con los datos de tu MySQL:

```php
define('BD_SERVIDOR',   'localhost');
define('BD_NOMBRE',     'chollopoint');
define('BD_USUARIO',    'tu_usuario');
define('BD_CONTRASENA', 'tu_contraseña');
```

Edita `helpers/jwt.php` y cambia la clave secreta antes de subir a producción:

```php
define('CLAVE_SECRETA_TOKEN', 'pon-aqui-una-clave-muy-larga-y-aleatoria-de-al-menos-32-caracteres');
```

### 3. Servidor de desarrollo (PHP integrado, el más rápido para probar)

```bash
cd chollopoint-backend
php -S localhost:8000
```

La API estará disponible en `http://localhost:8000`.

### 4. Apache (XAMPP / MAMP / producción)

Copia la carpeta dentro de `htdocs/` (XAMPP) o `/var/www/html/` y asegúrate de que `mod_rewrite` está activado.

```apache
# En tu VirtualHost o en httpd.conf:
<Directory "/var/www/html/chollopoint-backend">
    AllowOverride All
</Directory>
```

### 5. Docker (recomendado para tener todo listo de golpe)

```bash
docker compose up --build
```

### 6. Nginx (producción)

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

### 1. Copia `client.js` dentro de tu proyecto React

```
tu-proyecto-react/
└── src/
    └── api/
        └── client.js   ← aquí
```

### 2. Crea un fichero `.env` en la raíz del proyecto React

```env
VITE_API_URL=http://localhost:8000
```

### 3. Actualiza `AuthContext.jsx`

```jsx
import api from '../api/client';

// En AuthProvider:
const login = async (email, password) => {
    try {
        const respuesta = await api.login(email, password);
        setUsuario(respuesta.data.usuario);
        guardarEnStorage(respuesta.data.usuario);
        return { ok: true };
    } catch (error) {
        return { ok: false, mensaje: error.message };
    }
};

const registro = async (nombre, email, password) => {
    try {
        const respuesta = await api.registro(nombre, email, password);
        setUsuario(respuesta.data.usuario);
        guardarEnStorage(respuesta.data.usuario);
        return { ok: true };
    } catch (error) {
        return { ok: false, mensaje: error.message };
    }
};
```

### 4. Actualiza `PublicarChollo.jsx`

```jsx
import api from '../api/client';

// En handleSubmit, reemplaza la función local de guardar por:
const respuesta = await api.chollos.crear({ ...datosChollo, publicado_por: usuario.nombre });
```

---

## Endpoints de la API

### Autenticación

| Método | Ruta           | Login | Descripción              |
|--------|----------------|-------|--------------------------|
| POST   | /auth/registro | No    | Crear cuenta nueva       |
| POST   | /auth/login    | No    | Iniciar sesión           |
| GET    | /auth/me       | Sí    | Ver datos de mi cuenta   |

### Chollos

| Método | Ruta                    | Login | Descripción                         |
|--------|-------------------------|-------|-------------------------------------|
| GET    | /chollos                | No    | Listar chollos con filtros          |
| GET    | /chollos/{id}           | No    | Ver detalle de un chollo            |
| POST   | /chollos                | Sí    | Publicar un chollo nuevo (+10 pts)  |
| PUT    | /chollos/{id}           | Sí    | Editar un chollo (solo el autor)    |
| DELETE | /chollos/{id}           | Sí    | Borrar un chollo (solo el autor)    |
| POST   | /chollos/{id}/votar     | Sí    | Votar positivo o negativo           |

**Parámetros GET aceptados en /chollos:**
`categoria`, `ciudad`, `precio_min`, `precio_max`, `orden` (recent / priceLow / priceHigh / discount), `pagina`, `por_pagina`, `solo_activos`, `con_coords`

### Comentarios

| Método | Ruta                        | Login | Descripción                      |
|--------|-----------------------------|-------|----------------------------------|
| GET    | /chollos/{id}/comentarios   | No    | Ver comentarios de un chollo     |
| POST   | /chollos/{id}/comentarios   | Sí    | Publicar un comentario (+2 pts)  |
| DELETE | /comentarios/{id}           | Sí    | Borrar comentario (solo el autor)|
| POST   | /comentarios/{id}/votar     | Sí    | Votar un comentario              |

### Favoritos

| Método | Ruta              | Login | Descripción                          |
|--------|-------------------|-------|--------------------------------------|
| GET    | /favoritos        | Sí    | Ver mis chollos favoritos            |
| POST   | /favoritos/{id}   | Sí    | Guardar o quitar favorito (toggle)   |

### Usuarios

| Método | Ruta              | Login | Descripción                   |
|--------|-------------------|-------|-------------------------------|
| GET    | /usuarios/{id}    | No    | Ver perfil público            |
| PUT    | /usuarios/me      | Sí    | Editar mi perfil              |
| POST   | /usuarios/puntos  | Sí    | Sumar o restar puntos         |

---

## Sistema de puntos de CholloPoint

| Acción                         | Puntos |
|--------------------------------|--------|
| Publicar un chollo             | +10    |
| Escribir un comentario         | +2     |
| Recibir un voto positivo       | +1     |
| Los puntos nunca bajan de 0    | —      |

---

## Notas de seguridad importantes

- Las contraseñas se guardan con `password_hash()` (bcrypt). Nunca en texto plano.
- Los tokens de sesión JWT caducan en **7 días**.
- Cambia `CLAVE_SECRETA_TOKEN` en `helpers/jwt.php` antes de subir a producción.
- Activa HTTPS en producción para proteger los tokens en tránsito.
- Revisa la lista `$origenesPermitidos` en `index.php` y pon solo tu dominio real.