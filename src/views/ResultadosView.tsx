import React, { useState } from 'react';
import { AppDatasets, PartidoData } from '../types/data';
import {
  calcularResultadosRegionales,
  pesosPorBloques,
  repartoEntero,
  posicionEnEjes,
  valoresDePartido,
  desglose,
  Valor,
  MINIMO_RESPUESTAS,
  contarRespuestas,
  EjeId,
} from '../lib/motor';
import {
  getStoredProvincia,
  getStoredRespuestas,
  getStoredBloquesImportantes,
  borrarMisRespuestas,
} from '../services/storageService';
import { PartyDot } from '../components/PartyDot';
import { AvisosCompletos } from '../components/AvisosCompletos';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  BookMarked,
  Users,
  BookOpen,
  Trash2,
  Sliders,
  CheckCircle,
} from 'lucide-react';

interface ResultadosViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
  onResetAnswers: () => void;
}

const VALOR_LABELS: Record<Valor, string> = {
  [-2]: 'Totalmente en desacuerdo (−2)',
  [-1]: 'En desacuerdo (−1)',
  [0]: 'Neutral (0)',
  [1]: 'De acuerdo (+1)',
  [2]: 'Totalmente de acuerdo (+2)',
};

export const ResultadosView: React.FC<ResultadosViewProps> = ({
  datasets,
  onNavigate,
  onResetAnswers,
}) => {
  const { afirmaciones, ejes } = datasets.afirmacionesData;
  const { posiciones } = datasets.posicionesData;
  const { partidos } = datasets.partidosData;
  const { provincias } = datasets.provinciasData;

  const respuestas = getStoredRespuestas();
  const provinciaCodigo = getStoredProvincia();
  const bloquesImportantes = getStoredBloquesImportantes();

  const [expandedParty, setExpandedParty] = useState<string | null>(null);
  const [filterDesgloseSoloDiferentes, setFilterDesgloseSoloDiferentes] = useState(false);

  const respondidas = contarRespuestas(afirmaciones, respuestas);
  const provinciaActual = provincias.find((p) => p.codigo === provinciaCodigo);

  if (respondidas < MINIMO_RESPUESTAS) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-5">
        <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-slate-700">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Aún no has respondido suficientes preguntas</h1>
        <p className="text-slate-600 text-sm">
          Has respondido {respondidas} de las {MINIMO_RESPUESTAS} preguntas mínimas necesarias para calcular una afinidad representativa.
        </p>
        <button
          onClick={() => onNavigate('/test')}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors min-h-[44px]"
        >
          Continuar el test
        </button>
      </div>
    );
  }

  // 1. Calculate weights and regional results
  const pesos = pesosPorBloques(afirmaciones, bloquesImportantes);
  const { enTuProvincia, fueraDeTuProvincia } = calcularResultadosRegionales(
    afirmaciones,
    respuestas,
    posiciones,
    partidos,
    provinciaCodigo,
    pesos
  );

  // 2. Relative distribution (sums exactly 100)
  const enterosReparto = repartoEntero(enTuProvincia);

  // Partidos maps
  const partidosMap = new Map<string, PartidoData>(partidos.map((p) => [p.id, p]));

  // Separate elegibles and non-elegibles
  const elegiblesProvincia = enTuProvincia.filter((r) => r.elegible);
  const noElegiblesProvincia = enTuProvincia.filter((r) => !r.elegible);

  // 3. Ejes (Compass)
  const userEjes = posicionEnEjes(afirmaciones, respuestas);
  const idsEnResultados = new Set([
    ...enTuProvincia.map((r) => r.partidoId),
    ...fueraDeTuProvincia.map((r) => r.partidoId),
  ]);

  const partidosEjes = partidos
    .filter((p) => p.nivel === 1 && posiciones[p.id] && idsEnResultados.has(p.id))
    .map((p) => ({
      partido: p,
      pos: posicionEnEjes(afirmaciones, valoresDePartido(posiciones[p.id])),
    }));

  const toggleDesglose = (partidoId: string) => {
    setExpandedParty((prev) => (prev === partidoId ? null : partidoId));
  };

  const handleBorrarTodo = () => {
    borrarMisRespuestas();
    onResetAnswers();
    onNavigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Title & context */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tus resultados de afinidad
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Esto no es una recomendación de voto: indica a quién se parecen tus respuestas según lo que los partidos han votado, declarado y prometido.
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Circunscripción:{' '}
          <span className="font-semibold text-slate-800">
            {provinciaActual ? provinciaActual.nombre : 'Todas (sin provincia seleccionada)'}
          </span>{' '}
          · {respondidas} afirmaciones respondidas
          {bloquesImportantes.length > 0 && ` · ${bloquesImportantes.length} temas priorizados`}
        </p>
      </div>

      {/* Main Ranking: Partidos en tu provincia */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-900">
            {provinciaActual
              ? `Partidos que puedes votar en ${provinciaActual.nombre}`
              : 'Partidos en el test'}
          </h2>
          <span className="text-xs text-slate-500">
            {elegiblesProvincia.length} opciones analizadas
          </span>
        </div>

        <div className="space-y-3">
          {elegiblesProvincia.map((res) => {
            const partido = partidosMap.get(res.partidoId);
            if (!partido) return null;
            const afinidadRedondeada = res.afinidad !== null ? Math.round(res.afinidad) : null;
            const repartoPct = enterosReparto[res.partidoId] ?? 0;
            const isExpanded = expandedParty === res.partidoId;
            const tablaPos = posiciones[res.partidoId] ?? {};
            const lineasDesglose = desglose(afirmaciones, respuestas, tablaPos);

            const lineasFiltradas = filterDesgloseSoloDiferentes
              ? lineasDesglose.filter(
                  (l) => l.usuario !== null && l.partido !== null && l.usuario !== l.partido
                )
              : lineasDesglose;

            return (
              <div
                key={res.partidoId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
              >
                {/* Card Header / Summary */}
                <button
                  type="button"
                  onClick={() => toggleDesglose(res.partidoId)}
                  className="w-full p-4 sm:p-5 text-left flex flex-col gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <PartyDot color={partido.color} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base sm:text-lg text-slate-900">
                            {partido.siglas}
                          </span>
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            {partido.nombre}
                          </span>
                        </div>
                        {res.datosIncompletos && (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Datos incompletos (cobertura menor al 70%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {afinidadRedondeada}%
                      </span>
                      <span className="block text-[11px] font-medium text-slate-500 uppercase">
                        Afinidad
                      </span>
                    </div>
                  </div>

                  {/* Relative distribution bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Reparto relativo:</span>
                      <span className="font-semibold text-slate-800">{repartoPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, repartoPct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Basado en {res.comparadas} afirmaciones comparables</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-black">
                      {isExpanded ? 'Ocultar desglose' : 'Ver desglose'}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">
                        Comparativa respuesta por respuesta con {partido.siglas}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600">
                          <input
                            type="checkbox"
                            checked={filterDesgloseSoloDiferentes}
                            onChange={(e) => setFilterDesgloseSoloDiferentes(e.target.checked)}
                            className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                          />
                          <span>Solo donde no coinciden</span>
                        </label>
                        <button
                          onClick={() => onNavigate(`/partido/${partido.id}`)}
                          className="font-semibold text-slate-800 underline hover:text-black"
                        >
                          Ver ficha de {partido.siglas} →
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {lineasFiltradas.map((linea) => {
                        const af = afirmaciones.find((a) => a.id === linea.afirmacionId);
                        if (!af) return null;

                        const coincidenciaPct =
                          linea.coincidencia !== null
                            ? Math.round(linea.coincidencia * 100)
                            : null;

                        return (
                          <div
                            key={linea.afirmacionId}
                            className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-2"
                          >
                            <p className="font-medium text-slate-900 leading-snug">{af.texto}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <span className="font-semibold text-slate-500 block">Tú:</span>
                                <span className="text-slate-800 font-medium">
                                  {linea.usuario !== null
                                    ? VALOR_LABELS[linea.usuario]
                                    : 'Sin responder / No sé'}
                                </span>
                              </div>

                              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <span className="font-semibold text-slate-500 block">
                                  {partido.siglas}:
                                </span>
                                <span className="text-slate-800 font-medium">
                                  {linea.partido !== null
                                    ? VALOR_LABELS[linea.partido]
                                    : 'Sin posición conocida'}
                                </span>
                              </div>
                            </div>

                            {coincidenciaPct !== null && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">Coincidencia:</span>
                                <span
                                  className={`font-semibold ${
                                    coincidenciaPct >= 75
                                      ? 'text-emerald-700'
                                      : coincidenciaPct <= 25
                                      ? 'text-red-700'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {coincidenciaPct}%
                                </span>
                              </div>
                            )}

                            {linea.posicion?.justificacion && (
                              <p className="text-slate-600 text-[11px] italic bg-slate-50/50 p-2 rounded border-l-2 border-slate-400">
                                «{linea.posicion.justificacion}»
                              </p>
                            )}

                            {linea.posicion?.fuentes && linea.posicion.fuentes.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                                <span className="text-slate-400">Fuentes:</span>
                                {linea.posicion.fuentes.map((f, i) => (
                                  <a
                                    key={i}
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-700 underline hover:text-black inline-flex items-center gap-0.5"
                                  >
                                    <span>{f.titulo}</span>
                                    {f.fecha && <span className="text-slate-400">({f.fecha})</span>}
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Partidos sin datos suficientes */}
      {noElegiblesProvincia.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Sin datos suficientes en el test
          </h3>
          <div className="space-y-2">
            {noElegiblesProvincia.map((res) => {
              const partido = partidosMap.get(res.partidoId);
              if (!partido) return null;
              return (
                <div
                  key={res.partidoId}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between text-slate-600"
                >
                  <div className="flex items-center gap-2">
                    <PartyDot color={partido.color} size="sm" />
                    <span className="font-semibold text-slate-800">{partido.siglas}</span>
                    <span>({partido.nombre})</span>
                  </div>
                  <span className="text-slate-500 italic">
                    Menos del 50% de afirmaciones respondidas tienen postura codificada
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Partidos fuera de tu provincia */}
      {fueraDeTuProvincia.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Otros partidos conocidos que no se presentan en tu provincia
            </h3>
            <p className="text-xs text-slate-500">
              Partidos de referencia estatal que no presentan candidatura en la circunscripción elegida. Solo se muestra afinidad (no reparto).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fueraDeTuProvincia.map((res) => {
              const partido = partidosMap.get(res.partidoId);
              if (!partido) return null;
              const afinidadRedondeada = res.afinidad !== null ? Math.round(res.afinidad) : null;
              return (
                <div
                  key={res.partidoId}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <PartyDot color={partido.color} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{partido.siglas}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          No en tu provincia
                        </span>
                      </div>
                      <span className="text-slate-500 block text-[11px] truncate max-w-[150px]">
                        {partido.nombre}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-base text-slate-900">
                      {afinidadRedondeada !== null ? `${afinidadRedondeada}%` : '—'}
                    </span>
                    <span className="block text-[10px] text-slate-400">Afinidad</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brújula Política (3 ejes horizontales) */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Brújula en los tres ejes</h2>
          <p className="text-xs text-slate-600">
            Compara tu posición general con la de los partidos en los tres ejes ideológicos (Económico, Social y Territorial).
          </p>
        </div>

        <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-5">
          {ejes.map((eje) => {
            const userPos = userEjes[eje.id as EjeId];
            return (
              <div key={eje.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>{eje.nombre}</span>
                  {userPos.valor === null && (
                    <span className="text-amber-700 text-[11px] font-normal">
                      Pocas respuestas en este eje
                    </span>
                  )}
                </div>

                {/* Labels for poles */}
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>← {eje.poloNegativo}</span>
                  <span>{eje.poloPositivo} →</span>
                </div>

                {/* Visual scale line */}
                <div className="relative w-full h-8 bg-slate-100 rounded-lg flex items-center border border-slate-200 px-3">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-1 bottom-1 w-[1px] bg-slate-300" />

                  {/* Party ticks */}
                  {partidosEjes.map(({ partido, pos }) => {
                    const pVal = pos[eje.id as EjeId]?.valor;
                    if (pVal === null || pVal === undefined) return null;
                    // value is -1 to +1 -> percentage 0% to 100%
                    const leftPct = ((pVal + 1) / 2) * 100;

                    return (
                      <div
                        key={partido.id}
                        className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                        style={{ left: `${leftPct}%` }}
                        title={`${partido.siglas}: ${pVal.toFixed(2)}`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: partido.color }}
                        />
                        <span className="text-[9px] font-bold text-slate-700 absolute -top-4 opacity-0 group-hover:opacity-100 bg-white px-1 rounded shadow-xs transition-opacity">
                          {partido.siglas}
                        </span>
                      </div>
                    );
                  })}

                  {/* User marker ("Tú") */}
                  {userPos.valor !== null && (
                    <div
                      className="absolute -translate-x-1/2 flex flex-col items-center z-10"
                      style={{ left: `${((userPos.valor + 1) / 2) * 100}%` }}
                    >
                      <span className="text-[10px] font-extrabold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm -mt-6">
                        Tú
                      </span>
                      <div className="w-3.5 h-3.5 bg-slate-900 rounded-full border-2 border-white shadow-sm" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimers & Next steps */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Garantías de privacidad y transparencia
        </h3>
        <AvisosCompletos />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        <button
          onClick={() => onNavigate('/relacion')}
          className="flex items-center justify-center gap-2 p-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors min-h-[48px]"
        >
          <BookMarked className="w-4 h-4" />
          <span>Tu relación con la política (7 preguntas)</span>
        </button>

        <button
          onClick={() => onNavigate('/partidos')}
          className="flex items-center justify-center gap-2 p-3.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors min-h-[48px]"
        >
          <Users className="w-4 h-4 text-slate-600" />
          <span>Ver las fichas de los partidos</span>
        </button>

        <button
          onClick={() => onNavigate('/como-se-vota')}
          className="flex items-center justify-center gap-2 p-3.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors min-h-[48px]"
        >
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>Cómo se vota el 29N</span>
        </button>

        <button
          onClick={() => onNavigate('/test')}
          className="flex items-center justify-center gap-2 p-3.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
          <span>Repetir o editar respuestas</span>
        </button>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={handleBorrarTodo}
          className="inline-flex items-center gap-1.5 text-xs text-red-700 hover:text-red-900 font-medium underline"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Borrar todas mis respuestas y reiniciar
        </button>
      </div>
    </div>
  );
};
