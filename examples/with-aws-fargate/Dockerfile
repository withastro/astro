# STAGE 1: Build the static assets
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Use clean install for reliable, reproducible builds
RUN npm ci

COPY . .
# Runs the standard build script defined in package.json
RUN npm run build

# STAGE 2: Serve with Hardened Nginx
FROM nginx:alpine

# Adjusts BUILD_DIR to match your framework's output folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Inject custom Nginx configuration for unprivileged ports and SPA routing
RUN echo "server {" > /etc/nginx/conf.d/default.conf && \
    echo "    listen 8080;" >> /etc/nginx/conf.d/default.conf && \
    echo "    listen [::]:8080;" >> /etc/nginx/conf.d/default.conf && \
    echo "    server_name localhost;" >> /etc/nginx/conf.d/default.conf && \
    echo "    location / {" >> /etc/nginx/conf.d/default.conf && \
    echo "        root /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf && \
    echo "        index index.html index.htm;" >> /etc/nginx/conf.d/default.conf && \
    echo "        try_files \$uri \$uri/ /index.html;" >> /etc/nginx/conf.d/default.conf && \
    echo "    }" >> /etc/nginx/conf.d/default.conf && \
    echo "}" >> /etc/nginx/conf.d/default.conf

# Silence unprivileged user directive warning in main config
RUN sed -i 's/^user\s\+nginx;/# user nginx;/' /etc/nginx/nginx.conf

# DevSecOps Hardening: Drop root privileges for the Nginx process
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]