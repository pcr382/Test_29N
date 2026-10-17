import { Afirmacion, Posicion, TablaPosiciones, TablaCapas, Valor, Fuente } from '../lib/motor';

export interface EscalaItem {
  valor: Valor;
  texto: string;
}

export interface EjeConfig {
  id: 'eco' | 'soc' | 'terr';
  nombre: string;
  poloNegativo: string;
  poloPositivo: string;
}

export interface BloqueConfig {
  id: string;
  nombre: string;
}

export interface AfirmacionData extends Afirmacion {
  fuentesContexto?: Array<{
    titulo: string;
    url: string;
    fecha?: string;
  }>;
}

export interface AfirmacionesJson {
  version: string;
  actualizado?: string;
  escala: EscalaItem[];
  ejes: EjeConfig[];
  bloques: BloqueConfig[];
  afirmaciones: AfirmacionData[];
  notaContexto?: string;
}

export interface PosicionesJson {
  version: string;
  actualizado?: string;
  aviso?: string;
  posiciones: TablaPosiciones;
}

export interface NotaFuente {
  titulo: string;
  url: string;
  fecha?: string;
}

export interface CoalicionItem {
  id: string;
  nombre: string;
  partidos: string[];
  circunscripciones: string[] | null;
  camaras?: ('congreso' | 'senado' | string)[];
  nota?: string | null;
  fuentes?: Fuente[];
}

export interface PartidoData {
  id: string;
  nombre: string;
  siglas: string;
  color: string;
  colorAproximado?: boolean;
  nivel: 1 | 2 | 3;
  ambito?: string;
  circunscripciones: 'todas' | string[];
  referenciaEstatal?: boolean;
  candidato?: {
    nombre: string | null;
    estado?: 'anunciado' | 'confirmado' | 'propuesto' | 'pendiente' | string;
    nota?: string;
    fuente?: {
      titulo: string;
      url: string;
      fecha?: string;
    };
  } | string;
  web?: string;
  programa?: {
    url?: string | null;
    estado?: string;
    titulo?: string;
  } | string;
  programa2023?: {
    url?: string;
    nota?: string;
    oficial?: string;
    titulo?: string;
  } | string;
  resumen?: string;
  resultados2023?: {
    votos?: number | null;
    porcentaje?: number | null;
    escanos?: number | null;
    nota?: string | null;
    fuentes?: Fuente[];
  } | null;
  provincias2023?: Record<string, { porcentaje: number | null; escanos: number | null }> | null;
  nota?: string | null;
  notaFuentes?: NotaFuente[];
  investidura2023?: {
    sanchez?: string | null;
    feijoo?: string | null;
    nota?: string | null;
    fuentes?: Fuente[];
  } | null;
  puntosClave?: string[];
}

export interface PartidosJson {
  version: string;
  actualizado?: string;
  aviso?: string;
  partidos: PartidoData[];
  coaliciones?: CoalicionItem[];
  criterioReferencia?: any;
}

export interface ContrasteJson {
  version: string;
  actualizado?: string;
  descripcion?: string;
  estado?: string;
  capas: TablaCapas;
  programas2023?: Record<string, string>;
  metodoPrograma2023?: string;
}

export interface FuenteItem {
  id: string;
  tipo: 'votacion' | 'programa' | 'declaracion' | 'otro';
  medio: string;
  titulo: string;
  fecha: string;
  url: string;
  paginas?: (number | string)[] | string;
  archivo?: string;
  usos?: string[];
}

export interface FuentesJson {
  version: string;
  generado?: string;
  actualizado?: string;
  descripcion?: string;
  tipos: Record<string, string>;
  total: number;
  porTipo: Record<string, number>;
  fuentes: FuenteItem[];
}

export interface SenadoProvincia {
  senadores: number;
  maxMarcas: number;
}

export interface IslaSenado {
  nombre: string;
  senadores: number;
  maxMarcas: number;
}

export interface ProvinciaItem {
  codigo: string;
  nombre: string;
  ccaa: string;
  diputados: number;
  senado: SenadoProvincia | { islas: IslaSenado[] };
}

export interface FuenteEscanos {
  titulo: string;
  url: string;
  nota?: string;
}

export interface ProvinciasJson {
  version: string;
  fuente?: string;
  fuenteEscanos?: FuenteEscanos;
  provincias: ProvinciaItem[];
}

export interface PreguntaRelacion {
  id: string;
  tipo: 'escala' | 'opciones';
  texto?: string;
  pregunta?: string;
  ayuda?: string;
  opciones?: Array<{ valor: string | number; texto: string }>;
  escala?: { min: number; max: number; minTexto?: string; maxTexto?: string };
}

export interface IndiceConfig {
  id: string;
  titulo: string;
  formula: string;
  explicacion?: string;
}

export interface RelacionPoliticaJson {
  version: string;
  titulo?: string;
  intro?: string;
  noContestar?: string;
  preguntas: PreguntaRelacion[];
  indices: Record<string, IndiceConfig>;
  niveles?: Record<string, { titulo: string; descripcion: string }>;
  aviso?: string;
  enlaceGuia?: { texto: string; ruta: string };
}

export interface AppDatasets {
  afirmacionesData: AfirmacionesJson;
  posicionesData: PosicionesJson;
  partidosData: PartidosJson;
  contrasteData: ContrasteJson;
  fuentesData: FuentesJson;
  provinciasData: ProvinciasJson;
  relacionData: RelacionPoliticaJson;
  ultimaActualizacion: string;
}
