# Test 29N

Test de afinidad para las elecciones generales del 29 de noviembre de 2026 en España. Compara tus respuestas con las posturas de los partidos y enlaza cada dato a su fuente.

Es un proyecto personal, independiente y sin ánimo de lucro. No es una web oficial ni una recomendación de voto.

## Qué hace

- **Test:** 40 afirmaciones en 10 bloques. Los resultados se muestran por provincia, con la afinidad con cada partido, un reparto relativo y una brújula de tres ejes (económico, social y territorial).
- **Fichas de partido:** candidatura, resultados de 2023, votaciones de investidura, posturas más claras y una tabla de promesas frente a hechos.
- **Información para votar:** guía «Cómo se vota» y página de fuentes, con una copia archivada de cada enlace.
- **Cuestionario opcional** «Tu relación con la política».
- **App instalable:** se puede instalar en el móvil (PWA) y funciona sin conexión después de la primera visita.

## Privacidad

- Las respuestas se calculan en el navegador y no se envían a ningún sitio. Solo se guardan en el almacenamiento de sesión mientras la pestaña está abierta, con el prefijo `test29n:`, y el botón «Borrar mis respuestas» las elimina.
- No hay cookies, analítica, anuncios ni recursos de terceros. La cabecera de seguridad solo permite conexiones a la propia web (`connect-src 'self'`).
- El código es público precisamente para que cualquiera pueda comprobarlo.

## Cómo funciona

- Web estática hecha con React, TypeScript y Vite.
- **Cálculo:** todos los cálculos están en `src/lib/motor.ts`. La metodología completa se explica en la página «Cómo funciona» de la app.
- **Datos:** posturas, fuentes, fichas y textos están en un repositorio aparte, [test-29n-datos](https://github.com/pcr382/test-29n-datos), con el historial público de cambios. Al compilar, `scripts/copiar-datos.mjs` los copia dentro de la app, así que el navegador solo se conecta a la propia web.
- **Comprobación:** la página `#/comprobacion` ejecuta 8 pruebas automáticas. Comprueba que cada partido sale primero si respondes como él, que el reparto suma 100, que los datos están completos y que las protecciones de la app publicada están activas.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `src/lib/motor.ts` | Motor de cálculo |
| `src/views/` | Pantallas de la app |
| `src/services/` | Carga de datos y almacenamiento de sesión |
| `public/` | Manifiesto, iconos, service worker (`sw.js`) y cabeceras de seguridad (`_headers`) |
| `scripts/copiar-datos.mjs` | Copia los datos dentro de la app al compilar |
| `scripts/generate-icons.js` | Regenera los iconos; necesita ImageMagick y se usa a mano |
| `server.ts` | Servidor de desarrollo, para la vista previa; no se usa en la versión publicada |

## Desarrollo

Requiere Node 22.

```
npm install
npm run dev
```

Para generar la misma versión que se publica:

```
npm run build && node scripts/copiar-datos.mjs
```

## Publicación

La app se publica en Cloudflare Pages, conectado a este repositorio:

- **Comando de compilación:** `npm run build && node scripts/copiar-datos.mjs`
- **Directorio de salida:** `dist`
- **Variable de entorno:** `NODE_VERSION` = `22`

Cada cambio en la rama `main` se publica automáticamente. Cuando cambian los datos, hay que volver a publicar la última versión desde Cloudflare unos 5 minutos después de subirlos.

## Errores y sugerencias

Si ves un error, abre una incidencia en este repositorio o escribe al correo de contacto que aparece en la app. Los datos se corrigen en [test-29n-datos](https://github.com/pcr382/test-29n-datos).
