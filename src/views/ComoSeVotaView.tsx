import React, { useState, useEffect } from 'react';
import { AppDatasets, ProvinciaItem } from '../types/data';
import { getStoredProvincia, setStoredProvincia } from '../services/storageService';
import { loadMarkdownContent } from '../services/dataService';
import { MarkdownView } from '../components/MarkdownView';
import { MapPin, Info, Search } from 'lucide-react';

interface ComoSeVotaViewProps {
  datasets: AppDatasets;
}

export const ComoSeVotaView: React.FC<ComoSeVotaViewProps> = ({ datasets }) => {
  const { provincias } = datasets.provinciasData;
  const [provinciaCodigo, setProvinciaCodigo] = useState<string | null>(() => getStoredProvincia());
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const provinciaActual = provincias.find((p) => p.codigo === provinciaCodigo);

  useEffect(() => {
    loadMarkdownContent('como-se-vota.md')
      .then((content) => {
        setMarkdown(content);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando como-se-vota.md:', err);
        setLoading(false);
      });
  }, []);

  const handleSelectProvincia = (cod: string | null) => {
    setProvinciaCodigo(cod);
    setStoredProvincia(cod);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Recuadro «En [provincia]» */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-700 flex-shrink-0" />
            <h2 className="text-lg font-bold text-slate-900">
              {provinciaActual
                ? `En ${provinciaActual.nombre} (${provinciaActual.ccaa})`
                : 'Datos de tu circunscripción provincial'}
            </h2>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={provinciaCodigo || ''}
              onChange={(e) => handleSelectProvincia(e.target.value || null)}
              className="w-full sm:w-auto p-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Selecciona tu provincia...</option>
              {provincias.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {provinciaActual ? (
          <div className="space-y-3 pt-2 border-t border-slate-200 text-sm text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500 block">Congreso de los Diputados</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {provinciaActual.diputados} diputados
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Se eligen mediante lista cerrada por representación proporcional (sistema D'Hondt).
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs uppercase font-bold text-slate-500 block">Senado</span>
                {'senadores' in provinciaActual.senado ? (
                  <>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {provinciaActual.senado.senadores} senadores
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Papeleta sepia de listas abiertas: puedes marcar hasta{' '}
                      <strong>{provinciaActual.senado.maxMarcas} candidatos</strong> (de cualquier partido).
                    </p>
                  </>
                ) : (
                  <div className="space-y-2 mt-1">
                    <p className="text-xs font-semibold text-slate-800">
                      Circunscripción insular (desglose por islas):
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {provinciaActual.senado.islas.map((isla) => (
                        <div key={isla.nombre} className="text-xs flex justify-between bg-slate-50 p-2 rounded">
                          <span className="font-medium text-slate-800">{isla.nombre}:</span>
                          <span>
                            {isla.senadores} sen. (máx {isla.maxMarcas} marcas)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {datasets.provinciasData.fuenteEscanos && (
              <p className="text-[11px] text-slate-400">
                Fuente escaños: {datasets.provinciasData.fuenteEscanos}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Elige tu provincia en el desplegable para ver cuántos diputados y senadores se eligen en tu papeleta y cuántas cruces puedes marcar.
          </p>
        )}
      </div>

      {/* Markdown Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Cargando guía de voto...</div>
        ) : (
          <MarkdownView content={markdown} />
        )}
      </div>
    </div>
  );
};
