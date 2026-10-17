import React from 'react';
import { NOMBRE_APP } from '../config';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  provinciaNombre?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate, provinciaNombre }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="text-left flex items-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded p-1"
          aria-label="Ir a la portada de Test 29N"
        >
          <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
            {NOMBRE_APP}
          </span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
            29N 2026
          </span>
        </button>

        <div className="flex items-center gap-2">
          {provinciaNombre && (
            <button
              onClick={() => onNavigate('/test')}
              className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors border border-slate-200 truncate max-w-[140px]"
              title="Cambiar provincia en el test"
            >
              📍 {provinciaNombre}
            </button>
          )}

          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <button
              onClick={() => onNavigate('/test')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                currentRoute === '/test' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Test
            </button>
            <button
              onClick={() => onNavigate('/partidos')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                currentRoute.startsWith('/partido') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Partidos
            </button>
            <button
              onClick={() => onNavigate('/como-se-vota')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                currentRoute === '/como-se-vota' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cómo se vota
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
