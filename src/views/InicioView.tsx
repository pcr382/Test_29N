import React from 'react';
import { AvisosCompletos } from '../components/AvisosCompletos';
import { AppDatasets } from '../types/data';
import { ArrowRight, Users, BookOpen, Database, RotateCcw } from 'lucide-react';
import { contarRespuestas } from '../lib/motor';
import { getStoredRespuestas } from '../services/storageService';
import { PWAInstallNotice } from '../components/PWAInstallNotice';

interface InicioViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return '—';
  const ymdMatch = fechaStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const dmyMatch = fechaStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return fechaStr;
}

export const InicioView: React.FC<InicioViewProps> = ({ datasets, onNavigate }) => {
  const respuestas = getStoredRespuestas();
  const respondidas = contarRespuestas(datasets.afirmacionesData.afirmaciones, respuestas);
  const tieneProgreso = respondidas > 0;
  const fechaFormateada = formatearFecha(datasets.ultimaActualizacion);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ¿A qué partidos te pareces?
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto">
          40 afirmaciones, unos 10 minutos, resultado inmediato y privado.
        </p>
      </div>

      {/* Main Action Callouts */}
      <div className="space-y-3">
        {tieneProgreso ? (
          <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                Tienes un test en curso ({respondidas} de 40 respondidas)
              </p>
              <p className="text-xs text-slate-600">
                Tus respuestas siguen guardadas en este navegador.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('/test')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                Continuar test
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('/test')}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-slate-800 active:scale-[0.99] transition-all shadow-sm min-h-[52px]"
          >
            <span>Empezar el test</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={() => onNavigate('/partidos')}
            className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Partidos y fichas</span>
          </button>
          <button
            onClick={() => onNavigate('/como-se-vota')}
            className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Cómo se vota</span>
          </button>
          <button
            onClick={() => onNavigate('/fuentes')}
            className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>Fuentes y datos</span>
          </button>
        </div>

        {/* PWA Install Notice */}
        <PWAInstallNotice />
      </div>

      {/* Disclaimers */}
      <div className="pt-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Transparencia y privacidad
        </h2>
        <AvisosCompletos />
      </div>

      {/* Timestamp */}
      <div className="pt-4 text-center">
        <p className="text-xs text-slate-500">
          Datos actualizados el{' '}
          <time className="font-medium text-slate-700">{fechaFormateada}</time>
        </p>
      </div>
    </div>
  );
};
