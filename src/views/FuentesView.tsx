import React, { useState } from 'react';
import { AppDatasets, FuenteItem } from '../types/data';
import { ExternalLink, Search, Archive, Link as LinkIcon, Filter } from 'lucide-react';
import { formatearFecha } from '../utils/date';

function formatearPaginas(paginas?: (number | string)[] | string | null): string | null {
  if (!paginas) return null;
  if (Array.isArray(paginas)) {
    if (paginas.length === 0) return null;
    return `Pág. ${paginas.join(', ')}`;
  }
  const str = String(paginas).trim();
  if (!str || str === '[]') return null;
  const partes = str.replace(/[\[\]]/g, '').trim().split(/[\s,]+/).filter(Boolean);
  if (partes.length === 0) return null;
  return `Pág. ${partes.join(', ')}`;
}

interface FuentesViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

export const FuentesView: React.FC<FuentesViewProps> = ({ datasets, onNavigate }) => {
  const { fuentesData, partidosData } = datasets;
  const { tipos, total, porTipo, fuentes } = fuentesData;
  const { partidos } = partidosData;

  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Map party name / acronym to id
  const findPartidoId = (nombreOSiglas: string) => {
    const p = partidos.find(
      (x) =>
        x.siglas.toLowerCase() === nombreOSiglas.toLowerCase() ||
        x.nombre.toLowerCase().includes(nombreOSiglas.toLowerCase())
    );
    return p ? p.id : null;
  };

  const fuentesFiltradas = fuentes.filter((f) => {
    if (tipoSeleccionado !== 'todos' && f.tipo !== tipoSeleccionado) {
      return false;
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const medioMatch = f.medio?.toLowerCase().includes(q);
      const tituloMatch = f.titulo?.toLowerCase().includes(q);
      return medioMatch || tituloMatch;
    }
    return true;
  });

  const renderUso = (uso: any, index: number) => {
    let texto = '';
    let ruta: string | null = null;

    if (uso.seccion === 'cómo se vota') {
      texto = 'Guía Cómo se vota';
      ruta = '/como-se-vota';
    } else if (uso.seccion === 'ficha') {
      texto = `Ficha de ${uso.partido}${uso.dato ? ` (${uso.dato})` : ''}`;
      const pId = findPartidoId(uso.partido);
      if (pId) ruta = `/partido/${pId}`;
    } else if (uso.seccion === 'postura') {
      texto = `Postura de ${uso.partido} en la afirmación ${uso.afirmacion}`;
      const pId = findPartidoId(uso.partido);
      if (pId) ruta = `/partido/${pId}`;
    } else if (uso.seccion === 'programa 2023') {
      texto = `Programa 2023 de ${uso.partido} (afirmación ${uso.afirmacion})`;
      const pId = findPartidoId(uso.partido);
      if (pId) ruta = `/partido/${pId}`;
    } else if (uso.seccion === 'contexto') {
      texto = `Contexto de la afirmación ${uso.afirmacion}`;
      ruta = '/test';
    } else {
      texto = `${uso.seccion || 'Uso en app'}${uso.partido ? ` (${uso.partido})` : ''}`;
    }

    if (ruta) {
      return (
        <button
          key={index}
          onClick={() => onNavigate(ruta!)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors text-left font-medium"
        >
          <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{texto}</span>
        </button>
      );
    }

    return (
      <span
        key={index}
        className="inline-block text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
      >
        {texto}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Fuentes y hemeroteca
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cada postura, votación parlamentaria y compromiso electoral tiene su fuente original verificable, con enlace y copia archivada permanente.
        </p>
      </div>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setTipoSeleccionado('todos')}
          className={`p-3 rounded-xl border text-left transition-all ${
            tipoSeleccionado === 'todos'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <span className="text-xl font-bold block">{total}</span>
          <span className="text-xs font-medium opacity-80">Todas las fuentes</span>
        </button>

        {Object.entries(tipos).map(([tipoKey, nombreTipo]) => {
          const count = porTipo[tipoKey] ?? 0;
          const isSelected = tipoSeleccionado === tipoKey;

          return (
            <button
              key={tipoKey}
              onClick={() => setTipoSeleccionado(tipoKey)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <span className="text-xl font-bold block">{count}</span>
              <span className="text-xs font-medium opacity-80 line-clamp-1">{nombreTipo}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por medio o título de la noticia / documento..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      {/* Fuentes list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {fuentesFiltradas.length} fuentes</span>
        </div>

        {fuentesFiltradas.length > 0 ? (
          <div className="space-y-3">
            {fuentesFiltradas.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    {(() => {
                      const textoPags = formatearPaginas(f.paginas);
                      return (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {f.medio}
                          </span>
                          {f.fecha && (
                            <span className="text-xs text-slate-500">
                              {formatearFecha(f.fecha)}
                            </span>
                          )}
                          {textoPags && (
                            <span className="text-xs text-slate-500 break-words max-w-full">
                              {textoPags}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-baseline gap-1"
                      >
                        <span>{f.titulo}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 self-center" />
                      </a>
                    </h2>
                  </div>

                  {f.archivo && (
                    <a
                      href={f.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors self-start flex-shrink-0"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copia archivada</span>
                    </a>
                  )}
                </div>

                {/* Dónde se usa */}
                {f.usos && f.usos.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Dónde se cita:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {f.usos.map((uso, idx) => renderUso(uso, idx))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            No se han encontrado fuentes con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
};
