import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share } from 'lucide-react';

export const PWAInstallNotice: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Oculto si la app ya está instalada en modo standalone
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Chromium con evento beforeinstallprompt disponible
  if (isInstallable) {
    return (
      <div className="bg-slate-100/90 border border-slate-300 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 flex-shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-xs text-slate-900">Usa Test 29N como app en tu móvil</p>
            <p className="text-[11px] text-slate-600 leading-snug">
              Instalación directa y privada, sin tiendas ni permisos especiales.
            </p>
          </div>
        </div>

        <button
          onClick={install}
          className="w-full sm:w-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar la app</span>
        </button>
      </div>
    );
  }

  // iPhone / Safari (WebKit no soporta beforeinstallprompt)
  if (isIOS) {
    return (
      <div className="bg-slate-100/90 border border-slate-300 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-800">
        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
          <Share className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-slate-900">Instala Test 29N en tu iPhone</p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Para instalarla, pulsa Compartir y luego Añadir a la pantalla de inicio.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
