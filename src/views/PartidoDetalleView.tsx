import React from 'react';
import { AppDatasets, PartidoData } from '../types/data';
import {
  posturasDestacadas,
  contrastePartido,
  Valor,
} from '../lib/motor';
import { getStoredProvincia } from '../services/storageService';
import { PartyDot } from '../components/PartyDot';
import {
  ExternalLink,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Info,
  Scale,
  Globe,
  FileText,
} from 'lucide-react';

interface PartidoDetalleViewProps {
  partidoId: string;
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

const VALOR_ETIQUETAS: Record<Valor, string> = {
  [2]: 'Muy a favor',
  [1]: 'A favor',
  [0]: 'Neutral',
  [-1]: 'En contra',
  [-2]: 'Muy en contra',
};

export const PartidoDetalleView: React.FC<PartidoDetalleViewProps> = ({
  partidoId,
  datasets,
  onNavigate,
}) => {
  const { partidos } = datasets.partidosData;
  const { afirmaciones } = datasets.afirmacionesData;
  const { posiciones } = datasets.posicionesData;
  const { capas, programas2023 } = datasets.contrasteData;
  const { provincias } = datasets.provinciasData;

  const provinciaUsuario = getStoredProvincia();
  const partido = partidos.find((p) => p.id === partidoId);

  if (!partido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-slate-600">Partido no encontrado.</p>
        <button
          onClick={() => onNavigate('/partidos')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
        >
          Volver a la lista de partidos
        </button>
      </div>
    );
  }

  // 6. Posturas destacadas (defiende y rechaza)
  const { defiende, rechaza } = posturasDestacadas(afirmaciones, posiciones, partido.id);

  // 7. Promesas frente a hechos
  const { filas, resumen } = contrastePartido(afirmaciones, capas, partido.id);
  // Only show rows that have at least one data point
  const filasConDato = filas.filter(
    (f) => f.programa2023 !== null || f.hechos !== null || f.programa2026 !== null
  );

  // Candidato helper
  const candObj = typeof partido.candidato === 'object' && partido.candidato !== null ? partido.candidato : null;
  const candNombre = candObj ? candObj.nombre : (partido.candidato as string) || null;

  // Provincias donde se presenta
  const provinciasNombres =
    partido.circunscripciones === 'todas'
      ? 'Todas las 52 circunscripciones de España'
      : partido.circunscripciones
          .map((cod) => provincias.find((pr) => pr.codigo === cod)?.nombre || cod)
          .join(', ');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('/partidos')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a partidos
        </button>
      </div>

      {/* 1. Header: Nombre, siglas, punto de color y resumen */}
      <section className="space-y-3 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <PartyDot color={partido.color} size="lg" />
          <h1 className="text-3xl font-black text-slate-900">{partido.siglas}</h1>
          <span className="text-lg text-slate-600 font-medium">{partido.nombre}</span>
        </div>

        {partido.resumen ? (
          <p className="text-base text-slate-700 leading-relaxed">{partido.resumen}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">Sin resumen disponible.</p>
        )}
      </section>

      {/* Candidatura */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Candidatura a la presidencia
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1">
          <p className="font-semibold text-slate-900">
            {candNombre || 'Pendiente'}
            {candObj?.estado && (
              <span className="ml-2 text-xs font-normal text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded capitalize">
                {candObj.estado}
              </span>
            )}
          </p>
          {candObj?.nota && <p className="text-xs text-slate-600">{candObj.nota}</p>}
          {candObj?.fuente && (
            <div className="pt-1 text-xs">
              <a
                href={candObj.fuente.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 underline hover:text-black inline-flex items-center gap-1"
              >
                <span>Fuente: {candObj.fuente.titulo}</span>
                {candObj.fuente.fecha && <span>({candObj.fuente.fecha})</span>}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Ámbito de presentación */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Ámbito de presentación
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
          <p className="text-slate-800 leading-relaxed">{provinciasNombres}</p>
        </div>
      </section>

      {/* Resultados de 2023 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Resultados elecciones generales 2023
        </h2>
        {partido.resultados2023 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 block">
                  {partido.resultados2023.escanos !== null && partido.resultados2023.escanos !== undefined
                    ? partido.resultados2023.escanos
                    : '—'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Escaños</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 block">
                  {partido.resultados2023.porcentaje !== null && partido.resultados2023.porcentaje !== undefined
                    ? `${partido.resultados2023.porcentaje.toFixed(2)}%`
                    : '—'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold uppercase">% Votos</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-lg sm:text-xl font-bold text-slate-900 block truncate">
                  {partido.resultados2023.votos !== null && partido.resultados2023.votos !== undefined
                    ? partido.resultados2023.votos.toLocaleString('es-ES')
                    : '—'}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Votos</span>
              </div>
            </div>

            {partido.resultados2023.nota && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {partido.resultados2023.nota}
              </p>
            )}

            {partido.resultados2023.fuentes && partido.resultados2023.fuentes.length > 0 && (
              <div className="pt-1 flex flex-col gap-1 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Fuentes de resultados 2023:</span>
                {partido.resultados2023.fuentes.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 underline hover:text-black inline break-words"
                  >
                    <span>{f.titulo}</span>
                    {f.fecha && <span className="text-slate-400"> ({f.fecha})</span>}
                    <ExternalLink className="w-2.5 h-2.5 inline-block ml-1 align-text-bottom flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {/* Tabla por provincias 2023 si existe */}
            {partido.provincias2023 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-slate-700">Desglose por provincia (2023):</p>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-slate-200">Provincia</th>
                        <th className="p-2 border-b border-slate-200 text-right">%</th>
                        <th className="p-2 border-b border-slate-200 text-right">Escaños</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(partido.provincias2023).map(([cod, datos]) => {
                        const provName = provincias.find((pr) => pr.codigo === cod)?.nombre || cod;
                        const esProvinciaUsuario = cod === provinciaUsuario;
                        return (
                          <tr
                            key={cod}
                            className={`border-b border-slate-100 ${
                              esProvinciaUsuario
                                ? 'bg-amber-50/80 font-bold text-slate-900'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <td className="p-2">
                              {provName} {esProvinciaUsuario && '📍 (tu provincia)'}
                            </td>
                            <td className="p-2 text-right">
                              {datos.porcentaje !== null && datos.porcentaje !== undefined
                                ? `${datos.porcentaje.toFixed(2)}%`
                                : '—'}
                            </td>
                            <td className="p-2 text-right">
                              {datos.escanos !== null && datos.escanos !== undefined
                                ? datos.escanos
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No participó en 2023 o sin datos.</p>
        )}
      </section>

      {/* Investiduras de 2023 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Votación en las investiduras de 2023
        </h2>
        {partido.investidura2023 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Sánchez */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <span className="font-semibold text-slate-600 block">Investidura Pedro Sánchez (PSOE):</span>
              <p className="text-sm font-bold text-slate-900">
                Voto: {partido.investidura2023.sanchez?.voto || 'No participó'}
              </p>
              {partido.investidura2023.sanchez?.nota && (
                <p className="text-slate-600 text-[11px]">{partido.investidura2023.sanchez.nota}</p>
              )}
              {partido.investidura2023.sanchez?.fuentes && (
                <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                  {partido.investidura2023.sanchez.fuentes.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 underline inline-flex items-center gap-0.5"
                    >
                      <span>{f.titulo}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Feijóo */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <span className="font-semibold text-slate-600 block">Investidura Alberto Núñez Feijóo (PP):</span>
              <p className="text-sm font-bold text-slate-900">
                Voto: {partido.investidura2023.feijoo?.voto || 'No participó'}
              </p>
              {partido.investidura2023.feijoo?.nota && (
                <p className="text-slate-600 text-[11px]">{partido.investidura2023.feijoo.nota}</p>
              )}
              {partido.investidura2023.feijoo?.fuentes && (
                <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                  {partido.investidura2023.feijoo.fuentes.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 underline inline-flex items-center gap-0.5"
                    >
                      <span>{f.titulo}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Sin datos de investidura.</p>
        )}
      </section>

      {/* Sus posturas más claras */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Sus posturas más claras en el test
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lo que más defiende */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-1 border-b border-slate-200">
              <ThumbsUp className="w-4 h-4 text-emerald-700" />
              <span>Lo que más defiende</span>
            </div>

            {defiende.length > 0 ? (
              <div className="space-y-2">
                {defiende.map((p) => (
                  <div
                    key={p.afirmacionId}
                    className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5"
                  >
                    <p className="font-semibold text-slate-900 leading-snug">{p.texto}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {VALOR_ETIQUETAS[p.valor]}
                      </span>
                      {p.confianza && (
                        <span className="text-slate-500">Confianza: {p.confianza}</span>
                      )}
                    </div>
                    {p.justificacion && (
                      <p className="text-slate-600 text-[11px] italic">«{p.justificacion}»</p>
                    )}
                    {p.fuentes && p.fuentes.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                        {p.fuentes.map((f, i) => (
                          <a
                            key={i}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 underline inline-flex items-center gap-0.5"
                          >
                            <span>{f.titulo}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hay posturas destacadas a favor.</p>
            )}
          </div>

          {/* Lo que más rechaza */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-1 border-b border-slate-200">
              <ThumbsDown className="w-4 h-4 text-rose-700" />
              <span>Lo que más rechaza</span>
            </div>

            {rechaza.length > 0 ? (
              <div className="space-y-2">
                {rechaza.map((p) => (
                  <div
                    key={p.afirmacionId}
                    className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5"
                  >
                    <p className="font-semibold text-slate-900 leading-snug">{p.texto}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {VALOR_ETIQUETAS[p.valor]}
                      </span>
                      {p.confianza && (
                        <span className="text-slate-500">Confianza: {p.confianza}</span>
                      )}
                    </div>
                    {p.justificacion && (
                      <p className="text-slate-600 text-[11px] italic">«{p.justificacion}»</p>
                    )}
                    {p.fuentes && p.fuentes.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                        {p.fuentes.map((f, i) => (
                          <a
                            key={i}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 underline inline-flex items-center gap-0.5"
                          >
                            <span>{f.titulo}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hay posturas destacadas en contra.</p>
            )}
          </div>
        </div>
      </section>

      {/* Promesas frente a hechos */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            Promesas frente a hechos (2023–2026)
          </h2>
          <p className="text-xs text-slate-500 leading-normal">
            Compara el programa electoral de 2023, las votaciones y decisiones de gobierno en la legislatura, y el programa de 2026.
          </p>
        </div>

        {filasConDato.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-semibold">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200 min-w-[180px]">Tema / Afirmación</th>
                    <th className="p-2.5 border-b border-slate-200 text-center min-w-[100px]">
                      Programa 2023
                    </th>
                    <th className="p-2.5 border-b border-slate-200 text-center min-w-[120px]">
                      Hechos 2023–2026
                    </th>
                    <th className="p-2.5 border-b border-slate-200 text-center min-w-[100px]">
                      Programa 2026
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filasConDato.map((f) => {
                    const hechosPos = capas.hechos?.[partido.id]?.[f.afirmacionId];
                    const p23Pos = capas.programa2023?.[partido.id]?.[f.afirmacionId];
                    const p26Pos = capas.programa2026?.[partido.id]?.[f.afirmacionId];

                    const renderValorCell = (val: Valor | null, pos?: { fuentes?: any[] }) => {
                      if (val === null) return <span className="text-slate-400">—</span>;
                      const etiqueta = VALOR_ETIQUETAS[val];
                      const primerEnlace = pos?.fuentes?.[0]?.url;

                      if (primerEnlace) {
                        return (
                          <a
                            href={primerEnlace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted text-slate-900 font-medium hover:text-black inline-flex items-center gap-1"
                          >
                            <span>{etiqueta}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        );
                      }
                      return <span className="font-medium text-slate-800">{etiqueta}</span>;
                    };

                    return (
                      <tr key={f.afirmacionId} className="hover:bg-slate-50/70">
                        <td className="p-2.5 text-slate-800 font-medium">
                          {f.texto}
                        </td>
                        <td className="p-2.5 text-center">
                          {renderValorCell(f.programa2023, p23Pos)}
                        </td>
                        <td className="p-2.5 text-center">
                          {renderValorCell(f.hechos, hechosPos)}
                        </td>
                        <td className="p-2.5 text-center">
                          {renderValorCell(f.programa2026, p26Pos)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 640px) */}
            <div className="block sm:hidden space-y-3">
              {filasConDato.map((f) => {
                const hechosPos = capas.hechos?.[partido.id]?.[f.afirmacionId];
                const p23Pos = capas.programa2023?.[partido.id]?.[f.afirmacionId];
                const p26Pos = capas.programa2026?.[partido.id]?.[f.afirmacionId];

                const renderValorCell = (val: Valor | null, pos?: { fuentes?: any[] }) => {
                  if (val === null) return <span className="text-slate-400">—</span>;
                  const etiqueta = VALOR_ETIQUETAS[val];
                  const primerEnlace = pos?.fuentes?.[0]?.url;

                  if (primerEnlace) {
                    return (
                      <a
                        href={primerEnlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-dotted text-slate-900 font-medium hover:text-black inline-flex items-center gap-1"
                      >
                        <span>{etiqueta}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    );
                  }
                  return <span className="font-medium text-slate-800">{etiqueta}</span>;
                };

                return (
                  <div
                    key={f.afirmacionId}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs shadow-2xs"
                  >
                    <p className="font-semibold text-slate-900 leading-snug">{f.texto}</p>
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Programa 2023:</span>
                        <div>{renderValorCell(f.programa2023, p23Pos)}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Hechos 2023–2026:</span>
                        <div>{renderValorCell(f.hechos, hechosPos)}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Programa 2026:</span>
                        <div>{renderValorCell(f.programa2026, p26Pos)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen phrases */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">
                {resumen.comparables > 0
                  ? `En ${resumen.coinciden} de ${resumen.comparables} temas comparables votó en la línea de su programa de 2023.`
                  : 'Todavía no hay temas comparables entre programa 2023 y votaciones.'}
              </p>

              {resumen.comparablesProgramas > 0 && (
                <p>
                  Cambia de postura entre 2023 y 2026 en {resumen.cambian} de {resumen.comparablesProgramas} temas comparados.
                </p>
              )}

              <p className="text-[11px] text-slate-500 pt-1 leading-normal">
                Nota metodológica: Solo se compara el sentido de cada postura (a favor o en contra). No hay ninguna nota de credibilidad ni juicio moral. Un grupo parlamentario puede votar en contra de un texto legal por discrepancias con otras partes de su articulado.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No hay datos de contraste disponibles aún para este partido.</p>
        )}
      </section>

      {/* Programas */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Programas electorales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Programa 2023 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="font-semibold text-slate-700 block">Elecciones generales 2023:</span>
            {(() => {
              const p23 = partido.programa2023;
              const linkDirecto = programas2023?.[partido.id];
              const p23Obj = typeof p23 === 'object' && p23 !== null ? p23 : null;
              const targetUrl = p23Obj?.url || linkDirecto || (typeof p23 === 'string' ? p23 : null);

              if (targetUrl) {
                return (
                  <div className="space-y-1">
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 font-semibold underline inline-flex items-center gap-1 hover:text-black"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{p23Obj?.titulo || 'Consultar programa electoral 2023'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {p23Obj?.nota && <p className="text-slate-500 text-[11px]">{p23Obj.nota}</p>}
                    {p23Obj?.oficial && (
                      <a
                        href={p23Obj.oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 text-[11px] underline block"
                      >
                        Enlace oficial alternativo
                      </a>
                    )}
                  </div>
                );
              }
              return <p className="text-slate-400 italic">No disponible o no publicado.</p>;
            })()}
          </div>

          {/* Programa 2026 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="font-semibold text-slate-700 block">Elecciones generales 2026:</span>
            {(() => {
              const p26 = partido.programa;
              const p26Obj = typeof p26 === 'object' && p26 !== null ? p26 : null;
              const url26 = p26Obj?.url || (typeof p26 === 'string' ? p26 : null);

              if (url26) {
                return (
                  <a
                    href={url26}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 font-semibold underline inline-flex items-center gap-1 hover:text-black"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{p26Obj?.titulo || 'Consultar programa electoral 2026'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                );
              }
              return <p className="text-slate-500 italic">Aún no publicado</p>;
            })()}
          </div>
        </div>
      </section>

      {/* Web oficial */}
      <section className="space-y-2 pt-2 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
          Web oficial
        </h2>
        {partido.web ? (
          <a
            href={partido.web}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{partido.web}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <p className="text-xs text-slate-500 italic">Sin web oficial registrada.</p>
        )}
      </section>
    </div>
  );
};
