import React, { useState } from 'react';
import { CONTACTO_EMAIL } from '../config';
import { borrarMisRespuestas } from '../services/storageService';
import { Trash2 } from 'lucide-react';

interface FooterProps {
  onResetAnswers: () => void;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onResetAnswers, onNavigate }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmClear = () => {
    borrarMisRespuestas();
    setShowConfirm(false);
    onResetAnswers();
  };

  return (
    <footer
      className="mt-16 sm:pb-12 pt-8 border-t border-slate-200 bg-white text-slate-600 text-xs text-center px-4"
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <p className="font-medium text-slate-700 leading-relaxed">
          Proyecto independiente · No oficial · Tus respuestas no salen de tu dispositivo · Solo informativo
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-500">
          <a
            href={`mailto:${CONTACTO_EMAIL}?subject=Test%2029N%20-%20Aviso%20de%20error`}
            className="text-slate-700 underline underline-offset-2 hover:text-slate-900 transition-colors"
          >
            ¿Has visto un error?
          </a>
          <span>·</span>
          <button
            onClick={() => onNavigate('/aviso-legal')}
            className="hover:text-slate-900 transition-colors"
          >
            Aviso legal
          </button>
          <span>·</span>
          <button
            onClick={() => onNavigate('/privacidad')}
            className="hover:text-slate-900 transition-colors"
          >
            Privacidad
          </button>
          <span>·</span>
          <button
            onClick={() => onNavigate('/metodologia')}
            className="hover:text-slate-900 transition-colors"
          >
            Cómo funciona
          </button>
          <span>·</span>
          <button
            onClick={() => onNavigate('/comprobacion')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Pruebas técnicas de validación del motor"
          >
            Comprobación técnica
          </button>
        </div>

        <div className="pt-2">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Borrar mis respuestas
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-md">
              <span className="text-slate-800 font-medium">¿Seguro que quieres borrar tus respuestas?</span>
              <button
                onClick={handleConfirmClear}
                className="px-2.5 py-1 text-xs font-semibold bg-red-700 text-white hover:bg-red-800 rounded transition-colors"
              >
                Sí, borrar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
