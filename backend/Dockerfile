# ---- Stage 1: Composer Dependencies ----
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ---- Stage 2: Production Image ----
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    curl \
    nginx \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache \
    && rm -rf /var/cache/apk/* \
    && mkdir -p /run/nginx

# Configure OPcache for production
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.enable_cli=1'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Configure PHP-FPM
RUN { \
    echo '[www]'; \
    echo 'listen = 127.0.0.1:9000'; \
    echo 'listen.owner = www-data'; \
    echo 'listen.group = www-data'; \
    echo 'listen.mode = 0660'; \
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 20'; \
    echo 'pm.start_servers = 5'; \
    echo 'pm.min_spare_servers = 3'; \
    echo 'pm.max_spare_servers = 8'; \
} > /usr/local/etc/php-fpm.d/zz-docker.conf

# Configure Nginx
RUN { \
    echo 'server {'; \
    echo '    listen 80;'; \
    echo '    server_name _;'; \
    echo '    root /var/www/html/public;'; \
    echo '    index index.php;'; \
    echo '    client_max_body_size 50M;'; \
    echo '    location / {'; \
    echo '        try_files $uri $uri/ /index.php?$query_string;'; \
    echo '    }'; \
    echo '    location ~ \.php$ {'; \
    echo '        fastcgi_pass 127.0.0.1:9000;'; \
    echo '        fastcgi_index index.php;'; \
    echo '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;'; \
    echo '        include fastcgi_params;'; \
    echo '        fastcgi_read_timeout 300;'; \
    echo '    }'; \
    echo '    location /storage {'; \
    echo '        alias /var/www/html/storage/app/public;'; \
    echo '        expires 30d;'; \
    echo '        add_header Cache-Control "public";'; \
    echo '    }'; \
    echo '}'; \
} > /etc/nginx/http.d/default.conf

# Configure Supervisor
RUN { \
    echo '[supervisord]'; \
    echo 'nodaemon=true'; \
    echo 'user=root'; \
    echo 'logfile=/dev/null'; \
    echo 'logfile_maxbytes=0'; \
    echo 'pidfile=/var/run/supervisord.pid'; \
    echo ''; \
    echo '[program:php-fpm]'; \
    echo 'command=php-fpm -F'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo 'autorestart=true'; \
    echo ''; \
    echo '[program:nginx]'; \
    echo 'command=nginx -g "daemon off;"'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo 'autorestart=true'; \
} > /etc/supervisord.conf

WORKDIR /var/www/html

# Copy composer dependencies from vendor stage
COPY --from=vendor /app/vendor ./vendor

# Copy application code
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Cache configuration for production
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

EXPOSE 80 9000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
