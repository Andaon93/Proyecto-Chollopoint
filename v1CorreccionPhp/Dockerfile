# ============================================================
#  Dockerfile — CholloPoint Backend
#
#  Este archivo le dice a Docker cómo construir el contenedor
#  que ejecuta el backend PHP de CholloPoint.
#
#  Para construir y arrancar el proyecto con Docker:
#    docker compose up --build
# ============================================================

FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/uploads.ini

RUN a2enmod rewrite

RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

EXPOSE 80

CMD ["bash", "-c", \
  "rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* && \
   a2enmod mpm_prefork && \
   sed -i \"s/Listen 80/Listen ${PORT:-80}/g\" /etc/apache2/ports.conf && \
   sed -i \"s/:80>/:${PORT:-80}>/g\" /etc/apache2/sites-enabled/000-default.conf && \
   apache2-foreground"]
