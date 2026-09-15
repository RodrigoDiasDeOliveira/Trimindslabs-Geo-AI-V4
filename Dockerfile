FROM nginx:alpine

# Copia a pasta compilada dist para o diretório web do Nginx
COPY dist /usr/share/nginx/html

# Configura a porta 8080 do Cloud Run e fallback para Single Page Application (SPA)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
