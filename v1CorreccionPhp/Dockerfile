# ============================================================
#  Dockerfile — CholloPoint Backend
#
#  Este archivo le dice a Docker cómo construir el contenedor
#  que ejecuta el backend PHP de CholloPoint.
#
#  Para construir y arrancar el proyecto con Docker:
#    docker compose up --build
# ============================================================

# Usamos la imagen oficial de PHP 8.2 con Apache ya incluido
FROM php:8.2-apache

# Instalamos las extensiones de PHP necesarias para conectar con MySQL
RUN docker-php-ext-install pdo pdo_mysql

# ← AÑADE ESTO:
RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size = 20M"      >> /usr/local/etc/php/conf.d/uploads.ini

# Resto igual...
# Activamos el módulo mod_rewrite de Apache
# Esto es necesario para que el .htaccess pueda redirigir las URLs a index.php
RUN a2enmod rewrite

# Permitimos que el .htaccess funcione en el directorio del proyecto
# Por defecto Apache ignora los .htaccess; este comando lo activa
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Copiamos todos los archivos del backend dentro del contenedor
# /var/www/html/ es la carpeta raíz que Apache sirve por defecto
COPY . /var/www/html/

# Le damos los permisos correctos a los archivos
# www-data es el usuario con el que corre Apache dentro del contenedor
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

# Indicamos que el contenedor escucha en el puerto 80 (HTTP)
EXPOSE 80