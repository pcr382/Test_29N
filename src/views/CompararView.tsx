import React, { useState } from 'react';
import { AppDatasets, PartidoData } from '../types/data';
import { Valor } from '../lib/motor';
import { PartyDot } from '../components/PartyDot';
import { ExternalLink, ArrowLeftRight } from 'lucide-react';

interface CompararViewProps {
  datasets: AppDatasets;
}

const VALOR_ETIQUETAS: Record<Valor, string> = {
  [2]: 'Muy a favor (+2)',
  [1]: 'A favor (+1)',
  [0]: 'Neutral (0)',
  [-1]: 'En contra (−1)',
  [-2]: 'Muy en contra (−2)',
};

export const CompararView: React.FC<CompararViewProps> = ({ datasets }) => {
  const { afirmaciones, bloques } = datasets.afirmacionesData;
  const { partidos } = datasets.partidosData;
  const { posiciones } = datasets.posicionesData;

  // Filter parties that have positions coded
  const partidosConTest = partidos.filter((p) => p.nivel === 1 && posiciones[p.id]);

  const [partidoIdA, setPartidoIdA] = useState<string>(partidosConTest[0]?.id || '');
  const [partidoIdB, setPartidoIdB] = useState<string>(partidosConTest[1]?.id || '');
  const [soloDiferencias, setSoloDiferencias] = useState<boolean>(false);

  const partidoA = partidos.find((p) => p.id === partidoIdA);
  const partidoB = partidos.find((p) => p.id === partidoIdB);

  const tablaA = posiciones[partidoIdA] ?? {};
  const tablaB = posiciones[partidoIdB] ?? {};

  // Build comparison rows
  const filas = afirmaciones.map((af) => {
    const posA = tablaA[af.id];
    const posB = tablaB[af.id];
    const valA = posA?.valor ?? null;
    const valB = posB?.valor ?? null;
    const coinciden = valA !== null && valB !== null && valA === valB;

    return {
      af,
      valA,
      valB,
      posA,
      posB,
      coinciden,
    };
  });

  const filasFiltradas = soloDiferencias ? filas.filter((f) => !f.coinciden) : filas;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Comparar dos partidos
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Compara punto por punto la postura de dos candidaturas en las 40 afirmaciones del test electoral.
        </p>
      </div>

      {/* Party Selectors */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Primer partido:
          </label>
          <div className="relative">
            <select
              value={partidoIdA}
              onChange={(e) => setPartidoIdA(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {partidosConTest.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === partidoIdB}>
                  {p.siglas} — {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Segundo partido:
          </label>
          <div className="relative">
            <select
              value={partidoIdB}
              onChange={(e) => setPartidoIdB(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {partidosConTest.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === partidoIdA}>
                  {p.siglas} — {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
          <input
            type="checkbox"
            checked={soloDiferencias}
            onChange={(e) => setSoloDiferencias(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
          />
          <span>Mostrar solo afirmaciones donde discrepan</span>
        </label>

        <span className="text-slate-500">
          Mostrando {filasFiltradas.length} de {afirmaciones.length} afirmaciones
        </span>
      </div>

      {/* Comparison table */}
      <div className="space-y-4">
        {filasFiltradas.map(({ af, valA, valB, posA, posB, coinciden }) => {
          const bloqueNombre = bloques.find((b) => b.id === af.bloque)?.nombre;

          return (
            <div
              key={af.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 space-y-3 transition-colors ${
                coinciden ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider">{bloqueNombre}</span>
                {coinciden ? (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Coinciden
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Discrepan
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {af.texto}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {/* Partido A column */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <PartyDot color={partidoA?.color} size="sm" />
                    <span className="font-bold text-slate-900">{partidoA?.siglas}</span>
                  </div>

                  <p className="font-semibold text-slate-800 text-sm">
                    {valA !== null ? VALOR_ETIQUETAS[valA] : 'Sin posición codificada'}
                  </p>

                  {posA?.justificacion && (
                    <p className="text-slate-600 text-[11px] italic">«{posA.justificacion}»</p>
                  )}

                  {posA?.fuentes && posA.fuentes.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                      {posA.fuentes.map((f, i) => (
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

                {/* Partido B column */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <PartyDot color={partidoB?.color} size="sm" />
                    <span className="font-bold text-slate-900">{partidoB?.siglas}</span>
                  </div>

                  <p className="font-semibold text-slate-800 text-sm">
                    {valB !== null ? VALOR_ETIQUETAS[valB] : 'Sin posición codificada'}
                  </p>

                  {posB?.justificacion && (
                    <p className="text-slate-600 text-[11px] italic">«{posB.justificacion}»</p>
                  )}

                  {posB?.fuentes && posB.fuentes.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                      {posB.fuentes.map((f, i) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
