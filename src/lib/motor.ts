/**
 * motor.ts — Motor de cálculo del test de afinidad (v0.2, 11-10-2026)
 *
 * Escala común para usuario y partidos: −2 (totalmente en desacuerdo) … +2 (totalmente de acuerdo).
 * null = «No sé» (usuario) o «sin posición» (partido): esa afirmación no cuenta.
 * Este módulo es puro: no hace llamadas de red, no usa almacenamiento y no tiene efectos secundarios.
 * NO reescribir su lógica desde la interfaz: la metodología publicada depende de ella.
 */

export type Valor = -2 | -1 | 0 | 1 | 2;
export type EjeId = 'eco' | 'soc' | 'terr';

export interface Afirmacion {
  id: string;
  bloque: string;
  texto: string;
  eje: EjeId | null;
  /** +1: estar de acuerdo acerca al polo positivo del eje (derecha / conservador / centralista); −1: al negativo; 0: sin eje. */
  sentido: 1 | -1 | 0;
  contexto?: string;
}

export interface Fuente {
  tipo: 'votacion' | 'programa' | 'declaracion' | 'otro';
  titulo: string;
  url: string;
  fecha?: string; // AAAA-MM-DD
}

export interface Posicion {
  valor: Valor | null;
  confianza?: 'alta' | 'media' | 'baja';
  justificacion?: string;
  fuentes?: Fuente[];
}

/** posiciones[partidoId][afirmacionId] */
export type TablaPosiciones = Record<string, Record<string, Posicion | undefined>>;
export type Respuestas = Record<string, Valor | null | undefined>;
/** Peso por afirmación (1 por defecto). */
export type Pesos = Record<string, number>;

export interface Opciones {
  /** Pendiente de la softmax del reparto relativo (con la afinidad en %). */
  k?: number;
  /** Fracción mínima de las afirmaciones respondidas en las que el partido debe tener posición. */
  coberturaMinima?: number;
  /** Por debajo de esta cobertura, el partido entra en el ranking con el aviso «datos incompletos». */
  coberturaAviso?: number;
  /** Número mínimo de afirmaciones comparadas para entrar en el ranking. */
  minimoComparadas?: number;
}

export const OPCIONES_POR_DEFECTO: Required<Opciones> = { k: 0.05, coberturaMinima: 0.5, coberturaAviso: 0.7, minimoComparadas: 8 };
/** Respuestas mínimas (sin contar «No sé») para mostrar resultados. */
export const MINIMO_RESPUESTAS = 10;

export interface ResultadoPartido {
  partidoId: string;
  /** Afinidad 0–100 (sin redondear). null si no hay ninguna afirmación comparable. */
  afinidad: number | null;
  /** Afirmaciones en las que se ha podido comparar (respondidas por el usuario y con posición del partido). */
  comparadas: number;
  /** comparadas / respondidas, de 0 a 1. */
  cobertura: number;
  /** Entra en el ranking y en el reparto relativo. */
  elegible: boolean;
  /** Elegible, pero con posición en menos del 70 % de lo respondido: mostrar el aviso «datos incompletos». */
  datosIncompletos: boolean;
  /** Reparto relativo 0–100; suma 100 entre los elegibles. null si no es elegible. */
  reparto: number | null;
}

export const esValor = (v: unknown): v is Valor =>
  typeof v === 'number' && Number.isInteger(v) && v >= -2 && v <= 2;

export function contarRespuestas(afirmaciones: Afirmacion[], respuestas: Respuestas): number {
  return afirmaciones.filter((a) => esValor(respuestas[a.id])).length;
}

/** Coincidencia en una afirmación: 1 si idénticas, 0 si opuestas al máximo (−2 frente a +2). */
export function coincidencia(usuario: Valor, partido: Valor): number {
  return 1 - Math.abs(usuario - partido) / 4;
}

/** Pesos ×factor para las afirmaciones de los bloques que el usuario marca como importantes. */
export function pesosPorBloques(afirmaciones: Afirmacion[], bloquesImportantes: string[], factor = 2): Pesos {
  const importantes = new Set(bloquesImportantes);
  const pesos: Pesos = {};
  for (const a of afirmaciones) pesos[a.id] = importantes.has(a.bloque) ? factor : 1;
  return pesos;
}

/**
 * Calcula afinidad, elegibilidad y reparto relativo para todos los partidos de `posiciones`.
 * Para separar los partidos que se pueden votar en una provincia, usa calcularResultadosRegionales.
 * Devuelve primero los elegibles (por afinidad descendente) y después el resto.
 */
export function calcularResultados(
  afirmaciones: Afirmacion[],
  respuestas: Respuestas,
  posiciones: TablaPosiciones,
  pesos: Pesos = {},
  opciones: Opciones = {},
): ResultadoPartido[] {
  const o = { ...OPCIONES_POR_DEFECTO, ...opciones };
  const respondidas = afirmaciones.filter((a) => esValor(respuestas[a.id]));
  const minimo = Math.min(o.minimoComparadas, respondidas.length);

  const resultados: ResultadoPartido[] = Object.keys(posiciones).map((partidoId) => {
    const tabla = posiciones[partidoId] ?? {};
    let suma = 0;
    let sumaPesos = 0;
    let comparadas = 0;
    for (const a of respondidas) {
      const p = tabla[a.id]?.valor;
      if (!esValor(p)) continue;
      const w = pesos[a.id] ?? 1;
      if (!(w > 0)) continue;
      suma += w * coincidencia(respuestas[a.id] as Valor, p);
      sumaPesos += w;
      comparadas++;
    }
    const afinidad = sumaPesos > 0 ? (100 * suma) / sumaPesos : null;
    const cobertura = respondidas.length > 0 ? comparadas / respondidas.length : 0;
    const elegible =
      afinidad !== null && respondidas.length > 0 && cobertura >= o.coberturaMinima && comparadas >= minimo;
    const datosIncompletos = elegible && cobertura < o.coberturaAviso;
    return { partidoId, afinidad, comparadas, cobertura, elegible, datosIncompletos, reparto: null };
  });

  // Reparto relativo: softmax de las afinidades de los elegibles (estable numéricamente).
  const elegibles = resultados.filter((r) => r.elegible);
  if (elegibles.length > 0) {
    const max = Math.max(...elegibles.map((r) => r.afinidad as number));
    const exps = elegibles.map((r) => Math.exp(o.k * ((r.afinidad as number) - max)));
    const total = exps.reduce((s, x) => s + x, 0);
    elegibles.forEach((r, i) => {
      r.reparto = (100 * exps[i]) / total;
    });
  }

  return resultados.sort((a, b) => {
    if (a.elegible !== b.elegible) return a.elegible ? -1 : 1;
    const da = a.afinidad ?? -1;
    const db = b.afinidad ?? -1;
    if (db !== da) return db - da;
    return b.comparadas - a.comparadas || a.partidoId.localeCompare(b.partidoId);
  });
}

/**
 * Reparto en enteros que suman exactamente 100 (método del mayor resto).
 * Úsalo para MOSTRAR el reparto; para ordenar, usa los valores sin redondear.
 */
export function repartoEntero(resultados: ResultadoPartido[]): Record<string, number> {
  const eleg = resultados.filter((r) => r.elegible && r.reparto !== null);
  const base = eleg.map((r) => ({ id: r.partidoId, ent: Math.floor(r.reparto as number), resto: (r.reparto as number) % 1 }));
  let falta = 100 - base.reduce((s, x) => s + x.ent, 0);
  const porResto = [...base].sort((a, b) => b.resto - a.resto);
  for (let i = 0; i < porResto.length && falta > 0; i++, falta--) porResto[i].ent++;
  const salida: Record<string, number> = {};
  for (const x of base) salida[x.id] = x.ent;
  return salida;
}

export interface PosicionEje {
  /** De −1 (polo negativo) a +1 (polo positivo). null si hay menos de `minimo` afirmaciones con valor. */
  valor: number | null;
  n: number;
}

/** Posición en los tres ejes a partir de valores −2…+2 por afirmación (sirve para usuario y para partidos). */
export function posicionEnEjes(
  afirmaciones: Afirmacion[],
  valores: Record<string, Valor | null | undefined>,
  minimo = 3,
): Record<EjeId, PosicionEje> {
  const acc: Record<EjeId, { s: number; n: number }> = { eco: { s: 0, n: 0 }, soc: { s: 0, n: 0 }, terr: { s: 0, n: 0 } };
  for (const a of afirmaciones) {
    if (!a.eje || a.sentido === 0) continue;
    const v = valores[a.id];
    if (!esValor(v)) continue;
    acc[a.eje].s += v * a.sentido;
    acc[a.eje].n++;
  }
  const salida = {} as Record<EjeId, PosicionEje>;
  for (const eje of ['eco', 'soc', 'terr'] as EjeId[]) {
    const { s, n } = acc[eje];
    salida[eje] = { valor: n >= minimo ? s / (2 * n) : null, n };
  }
  return salida;
}

/** Valores −2…+2 de un partido, listos para posicionEnEjes. */
export function valoresDePartido(tabla: Record<string, Posicion | undefined>): Record<string, Valor | null> {
  const salida: Record<string, Valor | null> = {};
  for (const [id, p] of Object.entries(tabla)) salida[id] = p && esValor(p.valor) ? p.valor : null;
  return salida;
}

export interface LineaDesglose {
  afirmacionId: string;
  usuario: Valor | null;
  partido: Valor | null;
  /** 0–1, null si alguno de los dos no tiene valor. */
  coincidencia: number | null;
  posicion?: Posicion;
}

/** Desglose afirmación a afirmación entre el usuario y un partido (para la pantalla de resultados). */
export function desglose(
  afirmaciones: Afirmacion[],
  respuestas: Respuestas,
  tablaPartido: Record<string, Posicion | undefined>,
): LineaDesglose[] {
  return afirmaciones.map((a) => {
    const u = respuestas[a.id];
    const pos = tablaPartido[a.id];
    const p = pos?.valor;
    const usuario = esValor(u) ? u : null;
    const partido = esValor(p) ? p : null;
    return {
      afirmacionId: a.id,
      usuario,
      partido,
      coincidencia: usuario !== null && partido !== null ? coincidencia(usuario, partido) : null,
      posicion: pos,
    };
  });
}

/** Comprueba la coherencia de los datos (úsalo al cargar los JSON o en un test). Devuelve la lista de problemas. */
export function validarDatos(afirmaciones: Afirmacion[], posiciones: TablaPosiciones): string[] {
  const problemas: string[] = [];
  const ids = new Set<string>();
  for (const a of afirmaciones) {
    if (ids.has(a.id)) problemas.push(`Afirmación duplicada: ${a.id}`);
    ids.add(a.id);
    if (a.eje === null && a.sentido !== 0) problemas.push(`${a.id}: sin eje pero con sentido ${a.sentido}`);
    if (a.eje !== null && a.sentido === 0) problemas.push(`${a.id}: tiene eje pero sentido 0`);
  }
  for (const [partido, tabla] of Object.entries(posiciones)) {
    for (const [id, p] of Object.entries(tabla)) {
      if (!ids.has(id)) problemas.push(`${partido}: posición para una afirmación que no existe (${id})`);
      if (p && p.valor !== null && !esValor(p.valor)) problemas.push(`${partido}/${id}: valor fuera de escala (${p.valor})`);
      if (p && esValor(p.valor) && (!p.fuentes || p.fuentes.length === 0)) problemas.push(`${partido}/${id}: posición sin fuente`);
    }
  }
  return problemas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resultados por provincia
// ─────────────────────────────────────────────────────────────────────────────

export interface PartidoBasico {
  id: string;
  /** 1 = test completo, 2 = solo programa, 3 = solo ficha. Solo el nivel 1 entra en el test. */
  nivel: 1 | 2 | 3;
  /** 'todas' o lista de códigos INE de provincia (dos dígitos) donde se presenta. */
  circunscripciones: 'todas' | string[];
  /** Partido conocido en toda España: se muestra aunque no se presente en la provincia del usuario. */
  referenciaEstatal?: boolean;
}

export interface ResultadosRegionales {
  /** Partidos que se pueden votar en la provincia (todos si no se ha elegido). El reparto suma 100 entre sus elegibles. */
  enTuProvincia: ResultadoPartido[];
  /** Partidos de referencia estatal que NO se presentan en la provincia: afinidad sí, reparto no (siempre null). */
  fueraDeTuProvincia: ResultadoPartido[];
}

export function seVotaEn(partido: PartidoBasico, provincia: string | null): boolean {
  if (provincia === null) return true;
  return partido.circunscripciones === 'todas' || partido.circunscripciones.includes(provincia);
}

/**
 * Separa los resultados en «los que puedes votar» y «otros partidos conocidos que no se presentan en tu provincia».
 * El reparto relativo solo se calcula entre los que se pueden votar, porque son las opciones reales.
 * Sin provincia (null), todos los partidos del test van a enTuProvincia.
 */
export function calcularResultadosRegionales(
  afirmaciones: Afirmacion[],
  respuestas: Respuestas,
  posiciones: TablaPosiciones,
  partidos: PartidoBasico[],
  provincia: string | null,
  pesos: Pesos = {},
  opciones: Opciones = {},
): ResultadosRegionales {
  const conTest = partidos.filter((p) => p.nivel === 1 && posiciones[p.id]);
  const dentro = conTest.filter((p) => seVotaEn(p, provincia)).map((p) => p.id);
  const fuera = conTest.filter((p) => !seVotaEn(p, provincia) && p.referenciaEstatal === true).map((p) => p.id);
  const subtabla = (ids: string[]): TablaPosiciones => Object.fromEntries(ids.map((id) => [id, posiciones[id]]));
  const enTuProvincia = calcularResultados(afirmaciones, respuestas, subtabla(dentro), pesos, opciones);
  const fueraDeTuProvincia = calcularResultados(afirmaciones, respuestas, subtabla(fuera), pesos, opciones).map(
    (r) => ({ ...r, reparto: null }),
  );
  return { enTuProvincia, fueraDeTuProvincia };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tu relación con la política (módulo final, aparte del test de afinidad)
// Las respuestas no se usan para calcular la afinidad con los partidos y no salen del dispositivo.
// ─────────────────────────────────────────────────────────────────────────────

export interface RespuestasRelacion {
  /** 0–10: satisfacción con el funcionamiento de la democracia en España. */
  democracia?: number | null;
  /** 0–10: confianza en los partidos políticos. */
  partidos?: number | null;
  /** 0–10: valoración de la gestión del Gobierno. */
  gobierno?: number | null;
  /** 0–10: valoración de la labor de la oposición. */
  oposicion?: number | null;
  /** ¿Algún partido representa bien tus ideas? */
  representacion?: 'si' | 'en-parte' | 'ninguno' | null;
  /** 0–10: probabilidad de ir a votar el 29N. */
  probabilidadVotar?: number | null;
  /** ¿Te plantearías votar en blanco? */
  votoBlanco?: 'no' | 'quiza' | 'si' | null;
}

export type NivelIndice = 'bajo' | 'medio' | 'alto';
export interface Indice {
  /** 0–100, redondeado. null si no hay datos suficientes. */
  valor: number | null;
  nivel: NivelIndice | null;
}
export interface IndicesRelacion {
  descontentoPolitica: Indice;
  descontentoGobierno: Indice;
  descontentoOposicion: Indice;
  cercaniaAbstencion: Indice;
  cercaniaVotoBlanco: Indice;
}

const es0a10 = (x: unknown): x is number => typeof x === 'number' && x >= 0 && x <= 10;
/** 0–10 invertido a 0–100: 10 (muy satisfecho) → 0 de descontento; 0 → 100. */
const invertir = (x: number | null | undefined): number | null => (es0a10(x) ? (10 - x) * 10 : null);
const PUNTOS_REPRESENTACION = { si: 0, 'en-parte': 50, ninguno: 100 } as const;
const PUNTOS_BLANCO = { no: 0, quiza: 50, si: 100 } as const;

/** Media ponderada que ignora los componentes sin dato y renormaliza los pesos. */
function mediaPonderada(componentes: Array<[number | null, number]>): number | null {
  let suma = 0;
  let pesos = 0;
  for (const [v, w] of componentes) {
    if (v === null) continue;
    suma += v * w;
    pesos += w;
  }
  return pesos > 0 ? suma / pesos : null;
}

function indice(v: number | null): Indice {
  if (v === null) return { valor: null, nivel: null };
  const valor = Math.round(Math.min(100, Math.max(0, v)));
  return { valor, nivel: valor < 34 ? 'bajo' : valor < 67 ? 'medio' : 'alto' };
}

/**
 * Índices orientativos de 0 a 100. No son predicciones: resumen lo que la persona ha contestado.
 * `afinidadMaxima`: la mayor afinidad entre los partidos que puede votar (null si no hay resultados).
 *   Cuenta para el voto en blanco: 70 % o más → 0; 40 % o menos → 100; lineal entre medias.
 */
export function indicesRelacion(r: RespuestasRelacion, afinidadMaxima: number | null): IndicesRelacion {
  const rep = r.representacion ? PUNTOS_REPRESENTACION[r.representacion] : null;
  const blanco = r.votoBlanco ? PUNTOS_BLANCO[r.votoBlanco] : null;
  const afinidadBaja =
    afinidadMaxima === null ? null : Math.min(1, Math.max(0, (70 - afinidadMaxima) / 30)) * 100;

  const descontento = mediaPonderada([
    [invertir(r.democracia), 1],
    [invertir(r.partidos), 1],
    [rep, 1],
  ]);
  return {
    descontentoPolitica: indice(descontento),
    descontentoGobierno: indice(invertir(r.gobierno)),
    descontentoOposicion: indice(invertir(r.oposicion)),
    cercaniaAbstencion: indice(
      mediaPonderada([
        [invertir(r.probabilidadVotar), 0.7],
        [descontento, 0.3],
      ]),
    ),
    cercaniaVotoBlanco: indice(
      mediaPonderada([
        [blanco, 0.5],
        [rep, 0.25],
        [afinidadBaja, 0.25],
      ]),
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ficha de partido: sus posturas más claras (hasta que se codifiquen los programas)
// ─────────────────────────────────────────────────────────────────────────────

export interface PosturaDestacada {
  afirmacionId: string;
  texto: string;
  valor: Valor;
  confianza: 'alta' | 'media' | 'baja' | null;
  justificacion: string | null;
  fuentes: Fuente[];
}

const RANGO_CONFIANZA = { alta: 0, media: 1, baja: 2 } as const;

/**
 * Lo que un partido más defiende y más rechaza según la tabla de posiciones.
 * Entran las posturas de intensidad 2 (autor de la iniciativa) y las de intensidad 1 con confianza alta,
 * ordenadas por intensidad, confianza y orden del test. Cada lista tiene como mucho `max` elementos.
 */
export function posturasDestacadas(
  afirmaciones: Afirmacion[],
  posiciones: TablaPosiciones,
  partidoId: string,
  max = 4,
): { defiende: PosturaDestacada[]; rechaza: PosturaDestacada[] } {
  const tabla = posiciones[partidoId] ?? {};
  const orden = new Map(afirmaciones.map((a, i) => [a.id, i]));
  const candidatas: PosturaDestacada[] = [];
  for (const a of afirmaciones) {
    const p = tabla[a.id];
    if (!p || !esValor(p.valor) || p.valor === 0) continue;
    const fuerte = Math.abs(p.valor) === 2;
    if (!fuerte && p.confianza !== 'alta') continue;
    candidatas.push({
      afirmacionId: a.id,
      texto: a.texto,
      valor: p.valor,
      confianza: p.confianza ?? null,
      justificacion: p.justificacion ?? null,
      fuentes: p.fuentes ?? [],
    });
  }
  const ordenar = (x: PosturaDestacada, y: PosturaDestacada) =>
    Math.abs(y.valor) - Math.abs(x.valor) ||
    RANGO_CONFIANZA[x.confianza ?? 'baja'] - RANGO_CONFIANZA[y.confianza ?? 'baja'] ||
    (orden.get(x.afirmacionId) ?? 0) - (orden.get(y.afirmacionId) ?? 0);
  return {
    defiende: candidatas.filter((c) => c.valor > 0).sort(ordenar).slice(0, max),
    rechaza: candidatas.filter((c) => c.valor < 0).sort(ordenar).slice(0, max),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Promesas frente a hechos: programa 2023 · hechos de la legislatura 2023–2026 · programa 2026
// ─────────────────────────────────────────────────────────────────────────────

export type CapaId = 'programa2023' | 'hechos' | 'programa2026';
/** capas[capa][partidoId][afirmacionId] */
export type TablaCapas = Partial<Record<CapaId, TablaPosiciones>>;

export interface FilaContraste {
  afirmacionId: string;
  texto: string;
  programa2023: Valor | null;
  hechos: Valor | null;
  programa2026: Valor | null;
  /** Programa 2023 frente a lo que hizo en la legislatura: mismo sentido, sentido contrario o sin datos para comparar. */
  promesaYHechos: 'coincide' | 'contradice' | null;
  /** Programa 2023 frente a programa 2026. */
  entreProgramas: 'mantiene' | 'cambia' | null;
}

export interface ResumenContraste {
  /** Afirmaciones con dato en programa 2023 y en hechos (y ninguno de los dos neutral). */
  comparables: number;
  coinciden: number;
  contradicen: number;
  /** Afirmaciones con dato en los dos programas. */
  comparablesProgramas: number;
  cambian: number;
}

const signo = (v: Valor | null): -1 | 0 | 1 | null => (v === null ? null : v > 0 ? 1 : v < 0 ? -1 : 0);
const valorCapa = (capas: TablaCapas, capa: CapaId, partidoId: string, afirmacionId: string): Valor | null => {
  const v = capas[capa]?.[partidoId]?.[afirmacionId]?.valor;
  return esValor(v) ? v : null;
};

/**
 * Compara, afirmación por afirmación, lo que un partido llevaba en su programa de 2023, lo que hizo en la
 * legislatura (votaciones y decisiones de Gobierno) y lo que lleva en su programa de 2026.
 * Solo compara el SENTIDO (a favor / en contra): una postura neutral (0) o ausente no se compara.
 */
export function contrastePartido(
  afirmaciones: Afirmacion[],
  capas: TablaCapas,
  partidoId: string,
): { filas: FilaContraste[]; resumen: ResumenContraste } {
  const filas: FilaContraste[] = afirmaciones.map((a) => {
    const p23 = valorCapa(capas, 'programa2023', partidoId, a.id);
    const hechos = valorCapa(capas, 'hechos', partidoId, a.id);
    const p26 = valorCapa(capas, 'programa2026', partidoId, a.id);
    const s23 = signo(p23);
    const sh = signo(hechos);
    const s26 = signo(p26);
    const promesaYHechos = s23 && sh ? (s23 === sh ? 'coincide' : 'contradice') : null;
    const entreProgramas = s23 !== null && s26 !== null ? (s23 === s26 ? 'mantiene' : 'cambia') : null;
    return { afirmacionId: a.id, texto: a.texto, programa2023: p23, hechos, programa2026: p26, promesaYHechos, entreProgramas };
  });
  const resumen: ResumenContraste = {
    comparables: filas.filter((f) => f.promesaYHechos !== null).length,
    coinciden: filas.filter((f) => f.promesaYHechos === 'coincide').length,
    contradicen: filas.filter((f) => f.promesaYHechos === 'contradice').length,
    comparablesProgramas: filas.filter((f) => f.entreProgramas !== null).length,
    cambian: filas.filter((f) => f.entreProgramas === 'cambia').length,
  };
  return { filas, resumen };
}
