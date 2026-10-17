import React, { useEffect, useState } from 'react';
import { loadMarkdownContent } from '../services/dataService';
import { MarkdownView } from '../components/MarkdownView';

interface ContenidoMarkdownViewProps {
  filename: 'metodologia.md' | 'aviso-legal.md' | 'privacidad.md';
  tituloFallback: string;
}

export const ContenidoMarkdownView: React.FC<ContenidoMarkdownViewProps> = ({
  filename,
  tituloFallback,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadMarkdownContent(filename)
      .then((res) => {
        setContent(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Error al cargar ${filename}:`, err);
        setError('No se pudo cargar el contenido. Por favor, inténtalo de nuevo.');
        setLoading(false);
      });
  }, [filename]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-2xs">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Cargando documento...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-700 text-sm space-y-3">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <MarkdownView content={content} />
        )}
      </div>
    </div>
  );
};
