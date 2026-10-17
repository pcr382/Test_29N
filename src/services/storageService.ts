import { Respuestas, RespuestasRelacion, Valor } from '../lib/motor';

const PREFIX = 'test29n:';

const KEYS = {
  PROVINCIA: `${PREFIX}provincia`,
  RESPUESTAS: `${PREFIX}respuestas`,
  BLOQUES_IMPORTANTES: `${PREFIX}bloques_importantes`,
  RELACION: `${PREFIX}relacion`,
  CURRENT_INDEX: `${PREFIX}current_index`,
};

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const val = sessionStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val) as T;
  } catch {
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[SessionStorage] Failed to save:', e);
  }
}

export function getStoredProvincia(): string | null {
  return safeGetItem<string | null>(KEYS.PROVINCIA, null);
}

export function setStoredProvincia(codigo: string | null): void {
  safeSetItem(KEYS.PROVINCIA, codigo);
}

export function getStoredRespuestas(): Respuestas {
  return safeGetItem<Respuestas>(KEYS.RESPUESTAS, {});
}

export function setStoredRespuesta(afirmacionId: string, valor: Valor | null): Respuestas {
  const actuales = getStoredRespuestas();
  actuales[afirmacionId] = valor;
  safeSetItem(KEYS.RESPUESTAS, actuales);
  return actuales;
}

export function setStoredRespuestas(respuestas: Respuestas): void {
  safeSetItem(KEYS.RESPUESTAS, respuestas);
}

export function getStoredBloquesImportantes(): string[] {
  return safeGetItem<string[]>(KEYS.BLOQUES_IMPORTANTES, []);
}

export function setStoredBloquesImportantes(bloques: string[]): void {
  safeSetItem(KEYS.BLOQUES_IMPORTANTES, bloques);
}

export function getStoredRelacion(): RespuestasRelacion {
  return safeGetItem<RespuestasRelacion>(KEYS.RELACION, {});
}

export function setStoredRelacion(relacion: RespuestasRelacion): void {
  safeSetItem(KEYS.RELACION, relacion);
}

export function getStoredTestIndex(): number {
  return safeGetItem<number>(KEYS.CURRENT_INDEX, 0);
}

export function setStoredTestIndex(index: number): void {
  safeSetItem(KEYS.CURRENT_INDEX, index);
}

/**
 * Borra todas las respuestas y datos del usuario de sessionStorage
 * eliminando únicamente las claves con prefijo 'test29n:'.
 */
export function borrarMisRespuestas(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      sessionStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('[SessionStorage] Error clearing keys:', e);
  }
}
