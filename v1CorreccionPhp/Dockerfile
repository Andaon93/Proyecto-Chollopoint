FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini \
 && echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/uploads.ini
RUN a2enmod rewrite
RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf
COPY . /var/www/html/
RUN chmod +x /var/www/html/start.sh
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html
EXPOSE 80
CMD ["/var/www/html/start.sh"]