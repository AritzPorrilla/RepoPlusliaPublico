#!/bin/sh

cp -r /public-snapshot/. /var/www/public/ 2>/dev/null || true

php artisan migrate --force
php artisan config:cache || php artisan config:clear
php artisan route:cache || php artisan route:clear

exec "$@"
