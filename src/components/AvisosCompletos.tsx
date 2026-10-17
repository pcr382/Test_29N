import React from 'react';
import { ShieldCheck, Smartphone, Info } from 'lucide-react';

interface AvisosCompletosProps {
  className?: string;
  compact?: boolean;
}

export const AvisosCompletos: React.FC<AvisosCompletosProps> = ({ className = '', compact = false }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-800 text-sm">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-900">No es una web oficial</p>
            <p className="text-slate-600 mt-0.5 leading-snug">
              Es un proyecto personal e independiente: no pertenece al Gobierno, a ninguna administración pública, a la Junta Electoral ni a ningún partido.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-800 text-sm">
        <div className="flex items-start gap-2.5">
          <Smartphone className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-900">Tus respuestas no salen de tu móvil</p>
            <p className="text-slate-600 mt-0.5 leading-snug">
              El test y el cuestionario final se calculan en tu dispositivo, no se envían a ningún servidor ni a ninguna IA y no se guardan. Mientras la pestaña está abierta se conservan en tu navegador para no perder el progreso; puedes borrarlas cuando quieras.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-800 text-sm">
        <div className="flex items-start gap-2.5">
          <Info className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-900">Solo informativo</p>
            <p className="text-slate-600 mt-0.5 leading-snug">
              El resultado dice a qué partidos te pareces según sus votaciones, declaraciones y programas. No es una recomendación de voto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
