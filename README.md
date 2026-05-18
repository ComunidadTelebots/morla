# Morla de la Valdería

Sitio web inicial para el pueblo de Morla de la Valdería.

## Estructura creada

- `index.html` — página principal con secciones de geografía, patrimonio y arquitectura tradicional
- `styles.css` — estilos modernos y responsivos para la web
- `app.js` — comportamiento básico del botón de contacto
- `historia/index.html` — subdominio con contenido histórico
- `patrimonio/index.html` — subdominio con el patrimonio local
- `turismo/index.html` — subdominio sobre rutas y naturaleza
- `eventos/index.html` — subdominio de fiestas y tradiciones
- `tpv/index.html` — experiencia TPV para ventas de chiringuito, eventos y donativos
- `tpv/precios.html` — editor de precios para usuarios con rol `editor`
- `server.py` — servidor con login, sesiones, roles, API de productos y archivos estáticos
- `data/prices.json` — catálogo editable del TPV
- `Dockerfile` — contenedor Nginx de la web pública
- `Dockerfile.tpv` — contenedor Python independiente para el TPV
- `web.nginx.conf` — configuración Nginx de la web pública
- `.env.example` — plantilla de credenciales del TPV, sin secretos reales

## Cómo ver la web

Abre `index.html` en el navegador o usa un servidor local si prefieres.

## Próximos pasos

- Añadir secciones como historia, fiestas y turismo
- Incluir imágenes locales y rutas del pueblo
- Conectar con un backend si quieres funcionalidades dinámicas

## Preparar para GitHub

Este proyecto ya está listo para subirse a GitHub. Puedes usar los siguientes pasos:

1. Crear un repositorio en GitHub.
2. En tu carpeta local:
   - `git init`
   - `git add .`
   - `git commit -m "Inicial web Morla de la Valdería"`
   - `git branch -M main`
   - `git remote add origin <URL-del-repositorio>`
   - `git push -u origin main`

## Despliegue en servidor

### Opción A: GitHub Pages

1. Sube el repositorio a GitHub.
2. En el repositorio, ve a `Settings` > `Pages`.
3. Elige la rama `main` y la carpeta `/ (root)` como fuente.
4. Activa el dominio personalizado y pon `morladelavalderia.es`.
5. Usa estos registros DNS:
   - A: `185.199.108.153`
   - A: `185.199.109.153`
   - A: `185.199.110.153`
   - A: `185.199.111.153`

   o bien un `CNAME` a `tuusuario.github.io` si GitHub lo recomienda.
6. Ya existe un archivo `CNAME` en el repositorio con `morladelavalderia.es`.

### Opción B: Servidor propio con Traefik

1. Copia los archivos estáticos al servidor (`/var/www/morla`, `C:\inetpub\wwwroot\morla`, etc.).
2. Configura Traefik con dos routers: uno para la web pública y otro para el TPV.
3. Reglas Traefik:
   - Web: `Host("morladelavalderia.es") || Host("www.morladelavalderia.es")`
   - TPV: `Host("tpv.morladelavalderia.es")`
4. Asegúrate de que Traefik tenga un middleware HTTPS (Let’s Encrypt) si quieres tráfico seguro.
5. Configura DNS para que `morladelavalderia.es` apunte a la IP pública del servidor o del balanceador.
6. El subdominio `tpv.morladelavalderia.es` se sirve desde el contenedor `morla-tpv`.

### Contenedores

Docker Compose levanta dos contenedores separados:

- `morla`: web pública estática con Nginx. No necesita las variables de usuarios del TPV.
- `morla-tpv`: TPV con login, sesiones, roles y edición de precios.

Así, si el TPV falla por credenciales, sesiones o edición de precios, la web pública sigue sirviendo el dominio principal. Para reconstruir ambos:

```bash
docker compose up -d --build
```

Para reconstruir solo el TPV:

```bash
docker compose up -d --build morla-tpv
```

### Usuarios del TPV

El TPV tiene inicio de sesion con varios usuarios, sesiones HttpOnly, SameSite, cookie segura, limite de intentos, CSRF para cambios de precios, roles, cabeceras de seguridad, bloqueo de iframes y cache privada desactivada.

1. Crea un archivo `.env` a partir de `.env.example`.
2. Cambia `APP_SECRET` por una clave aleatoria larga.
3. Define usuarios en `TPV_USERS` con el formato `usuario:contrasena:rol`.
4. Usa el rol `cajero` para vender y el rol `editor` para editar precios.
5. No subas `.env` al repositorio: ya esta ignorado por Git y por Docker.
6. Despliega con Traefik usando HTTPS.

Ejemplo:

```env
APP_SECRET=cambia-esto-por-una-clave-aleatoria-muy-larga
SESSION_COOKIE_SECURE=true
TPV_USERS=caja1:contrasena-larga-caja1:cajero,caja2:contrasena-larga-caja2:cajero,precios:contrasena-larga-precios:editor
```

El usuario con rol `editor` verá el enlace `Precios` dentro del TPV. Los cambios se guardan en `data/prices.json`, montado como volumen en Docker Compose.

Si faltan `APP_SECRET` o `TPV_USERS`, el contenedor no arranca. Esto evita publicar el TPV abierto por error.

### Opción C: Servidor directo sin Traefik

1. Copia los archivos al servidor.
2. Usa el servidor Python incluido o un proxy inverso delante del contenedor.
3. Configura DNS A a la IP pública del servidor.

## Tráfico DNS

Para conectar el dominio al servidor:

- Si usas GitHub Pages: apunta el dominio `morladelavalderia.es` a los IPs de GitHub o usa CNAME según GitHub Pages.
- Si usas un servidor propio/Traefik: apunta `morladelavalderia.es` a la IP pública del servidor.
- Para el TPV crea un registro DNS `A` o `CNAME` para `tpv.morladelavalderia.es` apuntando al mismo servidor que la web principal.
- El tiempo de propagación DNS puede tardar entre 10 minutos y varias horas.

## Analítica

Se ha incluido Google Analytics con la ID `G-F5P08EW3SV` en todas las páginas principales.
