# ==========================================
# STAGE 1: Build React Frontend Assets
# ==========================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Set production environment variables for compilation
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ==========================================
# STAGE 2: Fetch Backend Composer Vendor
# ==========================================
FROM composer:2 AS backend-vendor

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ==========================================
# STAGE 3: Final Production Environment
# ==========================================
FROM php:8.3-fpm-alpine

# Install System dependencies, Nginx, and Supervisor
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
    && mkdir -p /run/nginx \
    && mkdir -p /var/www/html/backend \
    && mkdir -p /var/www/html/frontend

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
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 20'; \
    echo 'pm.start_servers = 5'; \
    echo 'pm.min_spare_servers = 3'; \
    echo 'pm.max_spare_servers = 8'; \
} > /usr/local/etc/php-fpm.d/zz-docker.conf

# Configure Nginx to serve React SPA on / and Laravel API on /api
RUN { \
    echo 'server {'; \
    echo '    listen 80;'; \
    echo '    server_name _;'; \
    echo '    client_max_body_size 50M;'; \
    echo ''; \
    echo '    # Gzip Compression'; \
    echo '    gzip on;'; \
    echo '    gzip_types text/plain text/css application/json application/javascript text/xml;'; \
    echo ''; \
    echo '    # ─── API Routes (Laravel) ───'; \
    echo '    location /api {'; \
    echo '        alias /var/www/html/backend/public;'; \
    echo '        try_files $uri $uri/ /index.php?$query_string;'; \
    echo '        location ~ \.php$ {'; \
    echo '            fastcgi_pass 127.0.0.1:9000;'; \
    echo '            fastcgi_index index.php;'; \
    echo '            fastcgi_param SCRIPT_FILENAME /var/www/html/backend/public/index.php;'; \
    echo '            include fastcgi_params;'; \
    echo '            fastcgi_read_timeout 300;'; \
    echo '        }'; \
    echo '    }'; \
    echo ''; \
    echo '    # Laravel Sanctum Authenticated CSRF routes'; \
    echo '    location /sanctum {'; \
    echo '        alias /var/www/html/backend/public;'; \
    echo '        try_files $uri $uri/ /index.php?$query_string;'; \
    echo '        location ~ \.php$ {'; \
    echo '            fastcgi_pass 127.0.0.1:9000;'; \
    echo '            fastcgi_param SCRIPT_FILENAME /var/www/html/backend/public/index.php;'; \
    echo '            include fastcgi_params;'; \
    echo '        }'; \
    echo '    }'; \
    echo ''; \
    echo '    # Laravel Public Storage Link'; \
    echo '    location /storage {'; \
    echo '        alias /var/www/html/backend/storage/app/public;'; \
    echo '        expires 30d;'; \
    echo '        add_header Cache-Control "public";'; \
    echo '    }'; \
    echo ''; \
    echo '    # ─── Frontend SPA (React) ───'; \
    echo '    location / {'; \
    echo '        root /var/www/html/frontend;'; \
    echo '        index index.html;'; \
    echo '        try_files $uri $uri/ /index.html;'; \
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

# Copy assets and backend code
COPY --from=frontend-builder /app/dist /var/www/html/frontend
COPY --from=backend-vendor /app/vendor /var/www/html/backend/vendor
COPY backend/ /var/www/html/backend/

# Configure permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/backend/storage \
    && chmod -R 755 /var/www/html/backend/bootstrap/cache

WORKDIR /var/www/html/backend

# Build production cache configs
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
