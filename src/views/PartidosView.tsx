import React from 'react';
import { AppDatasets, PartidoData } from '../types/data';
import { seVotaEn } from '../lib/motor';
import { getStoredProvincia } from '../services/storageService';
import { PartyDot } from '../components/PartyDot';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface PartidosViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

export const PartidosView: React.FC<PartidosViewProps> = ({ datasets, onNavigate }) => {
  const { partidos } = datasets.partidosData;
  const { provincias } = datasets.provinciasData;
  const provinciaCodigo = getStoredProvincia();
  const provinciaActual = provincias.find((p) => p.codigo === provinciaCodigo);

  // Sorting: first those presented in province, then others. Inside each group, by 2023 votes descending
  const ordenarPorVotos2023 = (a: PartidoData, b: PartidoData) => {
    const va = a.resultados2023?.votos ?? 0;
    const vb = b.resultados2023?.votos ?? 0;
    return vb - va;
  };

  const enProvincia = partidos
    .filter((p) => seVotaEn(p, provinciaCodigo))
    .sort(ordenarPorVotos2023);

  const fueraProvincia = provinciaCodigo
    ? partidos.filter((p) => !seVotaEn(p, provinciaCodigo)).sort(ordenarPorVotos2023)
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Fichas de los partidos políticos
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Consulta las candidaturas, resultados históricos de 2023, posturas clave y contraste entre promesas de programa y hechos de la legislatura.
        </p>
        {provinciaActual && (
          <p className="text-xs text-slate-500 font-medium">
            Mostrando primero los partidos con candidatura en{' '}
            <strong className="text-slate-800">{provinciaActual.nombre}</strong>.
          </p>
        )}
      </div>

      {/* Partidos en tu provincia (o todos si no hay provincia) */}
      <div className="space-y-3">
        {provinciaActual && (
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
            Se presentan en {provinciaActual.nombre} ({enProvincia.length})
          </h2>
        )}

        <div className="grid grid-cols-1 gap-3">
          {enProvincia.map((p) => (
            <div
              key={p.id}
              onClick={() => onNavigate(`/partido/${p.id}`)}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <PartyDot color={p.color} size="md" />
                  <span className="font-bold text-lg text-slate-900">{p.siglas}</span>
                  <span className="text-sm text-slate-600">· {p.nombre}</span>
                </div>
                {p.resumen && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.resumen}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
                  {p.resultados2023?.escanos !== undefined && (
                    <span>
                      2023: <strong>{p.resultados2023.escanos} escaños</strong> (
                      {p.resultados2023.porcentaje?.toFixed(2)}%)
                    </span>
                  )}
                  {p.circunscripciones === 'todas' ? (
                    <span>Presente en toda España</span>
                  ) : (
                    <span>Presente en {p.circunscripciones.length} circunscripciones</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 self-end sm:self-center">
                <span>Ver ficha</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partidos fuera de tu provincia */}
      {fueraProvincia.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
            No se presentan en {provinciaActual?.nombre} ({fueraProvincia.length})
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {fueraProvincia.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate(`/partido/${p.id}`)}
                className="bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <PartyDot color={p.color} size="sm" />
                    <span className="font-bold text-base text-slate-800">{p.siglas}</span>
                    <span className="text-xs text-slate-500">· {p.nombre}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {p.circunscripciones === 'todas'
                      ? 'Todas'
                      : `Ámbito específico (${p.circunscripciones.length} circunscripciones)`}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                  <span>Ver ficha</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
