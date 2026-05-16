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

RUN printf '#!/bin/bash\n\
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*\n\
a2enmod mpm_prefork\n\
echo "Listen ${PORT:-80}" > /etc/apache2/ports.conf\n\
sed -i "s/:80>/:${PORT:-80}>/g" /etc/apache2/sites-enabled/000-default.conf\n\
echo "SetEnv MYSQLHOST ${MYSQLHOST}" >> /etc/apache2/apache2.conf\n\
echo "SetEnv MYSQLPORT ${MYSQLPORT}" >> /etc/apache2/apache2.conf\n\
echo "SetEnv MYSQLDATABASE ${MYSQLDATABASE}" >> /etc/apache2/apache2.conf\n\
echo "SetEnv MYSQLUSER ${MYSQLUSER}" >> /etc/apache2/apache2.conf\n\
echo "SetEnv MYSQLPASSWORD ${MYSQLPASSWORD}" >> /etc/apache2/apache2.conf\n\
exec apache2-foreground\n' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
