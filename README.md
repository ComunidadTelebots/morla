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
2. Configura Traefik con un router que use el host `morladelavalderia.es` y apunte a tu servicio de archivos estáticos.
3. Ejemplo de regla Traefik:
   - `Host("morladelavalderia.es")`
4. Asegúrate de que Traefik tenga un middleware HTTPS (Let’s Encrypt) si quieres tráfico seguro.
5. Configura DNS para que `morladelavalderia.es` apunte a la IP pública del servidor o del balanceador.

### Opción C: Servidor directo sin Traefik

1. Copia los archivos al servidor.
2. Usa Nginx/Apache para servir el contenido estático o un simple servidor web.
3. Configura DNS A a la IP pública del servidor.

## Tráfico DNS

Para conectar el dominio al servidor:

- Si usas GitHub Pages: apunta el dominio `morladelavalderia.es` a los IPs de GitHub o usa CNAME según GitHub Pages.
- Si usas un servidor propio/Traefik: apunta `morladelavalderia.es` a la IP pública del servidor.
- El tiempo de propagación DNS puede tardar entre 10 minutos y varias horas.

## Analítica

Se ha incluido Google Analytics con la ID `G-F5P08EW3SV` en todas las páginas principales.
