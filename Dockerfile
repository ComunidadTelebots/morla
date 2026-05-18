FROM nginx:stable-alpine

WORKDIR /usr/share/nginx/html

COPY index.html styles.css app.js analytics.js CNAME /usr/share/nginx/html/
COPY historia /usr/share/nginx/html/historia
COPY patrimonio /usr/share/nginx/html/patrimonio
COPY turismo /usr/share/nginx/html/turismo
COPY eventos /usr/share/nginx/html/eventos
COPY web.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
