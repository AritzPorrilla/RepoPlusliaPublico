# Stage 1: Build (PHP 8.4 CLI + Node with pnpm)
FROM php:8.4-cli AS builder

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql bcmath mbstring exif pcntl zip gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

RUN rm -rf node_modules && pnpm install --config.dangerouslyAllowAllBuilds && pnpm run build

# Stage 2: PHP runtime
FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo pdo_pgsql bcmath mbstring exif pcntl zip gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www

COPY --from=builder /app .

RUN cp -r /var/www/public /public-snapshot \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
