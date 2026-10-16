import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATA_BASE_URL } from './src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Allowed files mapping
const DATOS_PERMITIDOS = new Set([
  'afirmaciones.json',
  'posiciones.json',
  'partidos.json',
  'contraste.json',
  'fuentes.json',
  'provincias.json',
  'relacion-politica.json',
]);

const CONTENIDO_PERMITIDO = new Set([
  'como-se-vota.md',
  'metodologia.md',
  'aviso-legal.md',
  'privacidad.md',
]);

// Helper to convert GitHub URLs to raw URLs
export function toRawGitHubUrl(baseUrl: string, subfolder: 'data' | 'contenido', filename: string): string {
  let base = baseUrl.trim();
  // e.g. https://github.com/pcr382/test-29n-datos/tree/main -> https://raw.githubusercontent.com/pcr382/test-29n-datos/main
  const treeMatch = base.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)/);
  if (treeMatch) {
    const [, owner, repo, branch] = treeMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${subfolder}/${filename}`;
  }
  const blobMatch = base.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)/);
  if (blobMatch) {
    const [, owner, repo, branch] = blobMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${subfolder}/${filename}`;
  }
  base = base.replace(/\/+$/, '');
  return `${base}/${subfolder}/${filename}`;
}

interface CacheItem {
  data: string;
  contentType: string;
  timestamp: number;
}

const memoryCache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  if (isProd) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"
    );
  } else {
    // In dev / preview iframe, allow connection to raw.githubusercontent.com and frame from preview
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://raw.githubusercontent.com; frame-ancestors *"
    );
  }
  next();
});

// Generic fetcher with in-memory caching and fallback
async function handleFileRequest(
  res: express.Response,
  subfolder: 'data' | 'contenido',
  filename: string,
  contentType: string
) {
  const cacheKey = `${subfolder}:${filename}`;
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(cached.data);
  }

  const targetUrl = toRawGitHubUrl(DATA_BASE_URL, subfolder, filename);

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Fetch failed with HTTP ${response.status}`);
    }
    const text = await response.text();
    memoryCache.set(cacheKey, {
      data: text,
      contentType,
      timestamp: now,
    });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(text);
  } catch (err) {
    // If GitHub fails, serve last good copy if available
    if (cached) {
      console.warn(`[Proxy Fallback] Failed to refresh ${targetUrl}, serving cached copy.`);
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(cached.data);
    }
    console.error(`[Proxy Error] Failed to fetch ${targetUrl}:`, err);
    return res.status(502).json({ error: 'No se pudo obtener el archivo desde el origen' });
  }
}

// API Routes
app.get('/api/datos/:nombre', async (req, res) => {
  const { nombre } = req.params;
  if (!DATOS_PERMITIDOS.has(nombre)) {
    return res.status(404).json({ error: 'Fichero no encontrado' });
  }
  return handleFileRequest(res, 'data', nombre, 'application/json; charset=utf-8');
});

app.get('/api/contenido/:nombre', async (req, res) => {
  const { nombre } = req.params;
  if (!CONTENIDO_PERMITIDO.has(nombre)) {
    return res.status(404).json({ error: 'Fichero no encontrado' });
  }
  return handleFileRequest(res, 'contenido', nombre, 'text/markdown; charset=utf-8');
});

async function startServer() {
  if (!isProd) {
    // Dev: Mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Test 29N] Servidor iniciado en http://localhost:${PORT}`);
  });
}

startServer();
