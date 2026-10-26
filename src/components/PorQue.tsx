import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motivosDeAfinidad, LineaDesglose, Motivo, Pesos, Valor } from '../lib/motor';

const ETIQUETAS: Record<string, string> = {
  '-2': 'Muy en contra',
  '-1': 'En contra',
  '0': 'Neutral',
  '1': 'A favor',
  '2': 'Muy a favor',
};
const etiqueta = (v: Valor) => ETIQUETAS[String(v)];

interface PorQueProps {
  lineas: LineaDesglose[];
  pesos: Pesos;
  textos: Map<string, string>;
  siglas: string;
  abierto?: boolean;
}

/** «Por qué te sale este partido»: las afirmaciones en las que más coincides y en las que más te separas. */
export const PorQue: React.FC<PorQueProps> = ({ lineas, pesos, textos, siglas, abierto = false }) => {
  const { coincidencias, discrepancias } = motivosDeAfinidad(lineas, pesos, 3);
  if (coincidencias.length === 0 && discrepancias.length === 0) return null;

  const lista = (titulo: string, items: Motivo[], vacio: string, color: string) => (
    <section className="space-y-2 min-w-0">
      <h4 className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{titulo}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{vacio}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.afirmacionId} className="text-xs text-slate-700 break-words">
              <p className="leading-snug">{textos.get(m.afirmacionId) ?? m.afirmacionId}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tú: {etiqueta(m.usuario)} · {siglas}: {etiqueta(m.partido)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <details open={abierto} className="group border-t border-slate-100 px-4 sm:px-5 py-3">
      <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-black">
        Por qué te sale {siglas}
        <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {lista(`Donde más coincides con ${siglas}`, coincidencias, 'Ninguna coincidencia clara.', 'text-emerald-800')}
        {lista(`Donde más te separas de ${siglas}`, discrepancias, 'Ninguna discrepancia clara.', 'text-rose-800')}
      </div>
    </details>
  );
};
