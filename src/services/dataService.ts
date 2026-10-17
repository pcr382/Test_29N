import { DATA_BASE_URL } from '../config';
import {
  AfirmacionesJson,
  PosicionesJson,
  PartidosJson,
  ContrasteJson,
  FuentesJson,
  ProvinciasJson,
  RelacionPoliticaJson,
  AppDatasets,
} from '../types/data';

function toRawGitHubUrl(baseUrl: string, subfolder: 'data' | 'contenido', filename: string): string {
  let base = baseUrl.trim();
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

async function fetchWithFallback<T>(subfolder: 'data' | 'contenido', filename: string, isJson = true): Promise<T> {
  const localApiEndpoint = `/api/${subfolder === 'data' ? 'datos' : 'contenido'}/${filename}`;
  
  // 1. Try local server endpoint first
  try {
    const res = await fetch(localApiEndpoint);
    if (res.ok) {
      return (isJson ? await res.json() : await res.text()) as T;
    }
  } catch (e) {
    console.warn(`[dataService] Error al cargar desde ${localApiEndpoint}:`, e);
  }

  // 2. Direct GitHub fallback ONLY in preview/dev mode (import.meta.env.DEV === true)
  if (import.meta.env.DEV) {
    try {
      const rawUrl = toRawGitHubUrl(DATA_BASE_URL, subfolder, filename);
      const fallbackRes = await fetch(rawUrl);
      if (fallbackRes.ok) {
        return (isJson ? await fallbackRes.json() : await fallbackRes.text()) as T;
      }
    } catch (e) {
      console.warn(`[dataService] Falló el respaldo directo en vista previa para ${filename}:`, e);
    }
  }

  throw new Error(`No se pudo cargar el archivo ${filename} desde el servidor (/api)`);
}

let cachedDatasets: AppDatasets | null = null;
const cachedMarkdown = new Map<string, string>();

export async function loadAppDatasets(forceReload = false): Promise<AppDatasets> {
  if (cachedDatasets && !forceReload) {
    return cachedDatasets;
  }

  const [
    afirmacionesData,
    posicionesData,
    partidosData,
    contrasteData,
    fuentesData,
    provinciasData,
    relacionData,
  ] = await Promise.all([
    fetchWithFallback<AfirmacionesJson>('data', 'afirmaciones.json'),
    fetchWithFallback<PosicionesJson>('data', 'posiciones.json'),
    fetchWithFallback<PartidosJson>('data', 'partidos.json'),
    fetchWithFallback<ContrasteJson>('data', 'contraste.json'),
    fetchWithFallback<FuentesJson>('data', 'fuentes.json'),
    fetchWithFallback<ProvinciasJson>('data', 'provincias.json'),
    fetchWithFallback<RelacionPoliticaJson>('data', 'relacion-politica.json'),
  ]);

  // Find the most recent date from "actualizado" or "generado" fields
  const fechas = [
    afirmacionesData.actualizado,
    posicionesData.actualizado,
    partidosData.actualizado,
    contrasteData.actualizado,
    fuentesData.actualizado || fuentesData.generado,
  ].filter((f): f is string => typeof f === 'string' && f.length > 0);

  fechas.sort().reverse();
  const ultimaActualizacion = fechas[0] || '11-10-2026';

  cachedDatasets = {
    afirmacionesData,
    posicionesData,
    partidosData,
    contrasteData,
    fuentesData,
    provinciasData,
    relacionData,
    ultimaActualizacion,
  };

  return cachedDatasets;
}

export async function loadMarkdownContent(filename: 'como-se-vota.md' | 'metodologia.md' | 'aviso-legal.md' | 'privacidad.md'): Promise<string> {
  if (cachedMarkdown.has(filename)) {
    return cachedMarkdown.get(filename)!;
  }
  const content = await fetchWithFallback<string>('contenido', filename, false);
  cachedMarkdown.set(filename, content);
  return content;
}
