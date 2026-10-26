// Copia los datos públicos de GitHub dentro de la app compilada (dist/api/...).
// Así la app funciona como web estática, sin servidor, en Cloudflare Pages.
// Uso: después de «npm run build», ejecutar «node scripts/copiar-datos.mjs».
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const config = await readFile('src/config.ts', 'utf8');
const BASE = config.match(/DATA_BASE_URL\s*=\s*'([^']+)'/)?.[1];
if (!BASE) throw new Error('No encuentro DATA_BASE_URL en src/config.ts');

const DATOS = ['afirmaciones.json', 'posiciones.json', 'partidos.json', 'contraste.json', 'fuentes.json', 'provincias.json', 'relacion-politica.json'];
const CONTENIDO = ['como-se-vota.md', 'metodologia.md', 'aviso-legal.md', 'privacidad.md'];

// Ficheros que pueden no existir todavía en el repositorio de datos: si faltan, se omiten sin detener la publicación.
const OPCIONALES = ['adivina.json'];

async function copiar(origen, destino, nombres, esJson, opcional = false) {
  await mkdir(destino, { recursive: true });
  for (const nombre of nombres) {
    const res = await fetch(`${BASE}/${origen}/${nombre}`, { cache: 'no-store' });
    if (!res.ok && opcional) { console.warn(`· ${origen}/${nombre} no existe todavía: se omite`); continue; }
    if (!res.ok) throw new Error(`No se pudo descargar ${origen}/${nombre}: HTTP ${res.status}`);
    const texto = await res.text();
    if (esJson) JSON.parse(texto); // si un JSON está roto, la publicación se detiene y sigue la versión anterior
    await writeFile(`${destino}/${nombre}`, texto);
    console.log(`✓ ${origen}/${nombre} (${texto.length} caracteres)`);
  }
}

await copiar('data', 'dist/api/datos', DATOS, true);
await copiar('contenido', 'dist/api/contenido', CONTENIDO, false);
await copiar('data', 'dist/api/datos', OPCIONALES, true, true);
console.log('Datos copiados en dist/api');
