import React from 'react';
import { AfinidadBloque } from '../lib/motor';
import { PartyDot } from './PartyDot';

interface AfinidadTemasProps {
  filas: AfinidadBloque[];
  bloques: { id: string; nombre: string }[];
  partidosMap: Map<string, { siglas: string; color?: string }>;
  importantes?: string[];
}

/** Afinidad por temas: en cada bloque, los partidos con los que más coinciden tus respuestas (con los empates del tercer puesto). */
export const AfinidadTemas: React.FC<AfinidadTemasProps> = ({ filas, bloques, partidosMap, importantes = [] }) => {
  const nombre = new Map(bloques.map((b) => [b.id, b.nombre]));
  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Afinidad por temas</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          En cada bloque, los partidos con los que más coinciden tus respuestas. Un partido solo aparece si se
          puede comparar en al menos 2 afirmaciones del bloque.
        </p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {filas.map((f) => {
          const redondeados = f.partidos.map((p) => ({ ...p, pct: Math.round(p.afinidad) }));
          const corte = redondeados.length >= 3 ? redondeados[2].pct : -1;
          const mostrados = redondeados.filter((p) => p.pct >= corte);
          return (
            <li key={f.bloque} className="bg-white border border-slate-200 rounded-xl p-3.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{nombre.get(f.bloque) ?? f.bloque}</p>
                {importantes.includes(f.bloque) && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                    Importante
                  </span>
                )}
              </div>
              {f.respondidas < 2 ? (
                <p className="text-xs text-slate-500 mt-1.5">Has respondido menos de 2 afirmaciones de este bloque.</p>
              ) : mostrados.length === 0 ? (
                <p className="text-xs text-slate-500 mt-1.5">Ningún partido tiene datos suficientes en este bloque.</p>
              ) : (
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {mostrados.map((p) => {
                    const partido = partidosMap.get(p.partidoId);
                    return (
                      <li
                        key={p.partidoId}
                        className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs"
                      >
                        <PartyDot color={partido?.color} size="sm" />
                        <span className="font-medium text-slate-800">{partido?.siglas ?? p.partidoId}</span>
                        <span className="text-slate-500">{p.pct}%</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
