# Changelog

Todas las novedades del proyecto.

## [Unreleased]

- Preparación del sitio web estático de Morla de la Valdería.
- Añadido acceso directo a Instagram con estilo degradado.
- Añadidos subdominios: historia, patrimonio, turismo y eventos.
- Integrada analítica de Google con ID `G-F5P08EW3SV`.
- Subida inicial del proyecto a GitHub en `ComunidadTelebots/morla`.
- Añadido despliegue con Docker y Nginx mediante `Dockerfile`.
- Añadida configuración de Docker Compose para levantar la web como servicio `morla`.
- Configurado Traefik para publicar `morladelavalderia.es` por HTTPS.
- Añadido soporte para `www.morladelavalderia.es`.
- Añadido soporte para el dominio alternativo `morladelavalderia.duckdns.org`.
- Eliminada la exposición directa del puerto `8080` para evitar conflictos con otros contenedores.
- Conectado el servicio a la red externa `traefik` desde `docker-compose.yml`.
- Añadida la etiqueta `traefik.docker.network=traefik` para que Traefik enrute al contenedor correcto.
- Verificado el despliegue en servidor con respuesta `HTTP/2 200`.
- Configurado DNS del dominio para apuntar a la IP del servidor `72.60.186.130`.
