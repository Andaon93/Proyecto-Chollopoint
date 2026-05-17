
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
a2enmod mpm_prefork
echo "Listen ${PORT:-80}" > /etc/apache2/ports.conf
sed -i "s/:80>/:${PORT:-80}>/g" /etc/apache2/sites-enabled/000-default.conf
echo "<?php" > /var/www/html/config/db_env.php
echo "putenv('MYSQLHOST=${MYSQLHOST}');" >> /var/www/html/config/db_env.php
echo "putenv('MYSQLPORT=${MYSQLPORT}');" >> /var/www/html/config/db_env.php
echo "putenv('MYSQLDATABASE=${MYSQLDATABASE}');" >> /var/www/html/config/db_env.php
echo "putenv('MYSQLUSER=${MYSQLUSER}');" >> /var/www/html/config/db_env.php
echo "putenv('MYSQLPASSWORD=${MYSQLPASSWORD}');" >> /var/www/html/config/db_env.php
exec apache2-foreground
