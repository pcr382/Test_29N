import React, { useState } from 'react';
import { Home, HelpCircle, Users, BookOpen, MoreHorizontal, X, FileText, Database, Shield, BookMarked, Scale, RefreshCw } from 'lucide-react';

interface NavBottomProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onResetAnswers: () => void;
}

export const NavBottom: React.FC<NavBottomProps> = ({ currentRoute, onNavigate, onResetAnswers }) => {
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    { label: 'Inicio', route: '/', icon: Home },
    { label: 'Test', route: '/test', icon: HelpCircle },
    { label: 'Partidos', route: '/partidos', icon: Users },
    { label: 'Cómo se vota', route: '/como-se-vota', icon: BookOpen },
  ];

  const handleSelect = (route: string) => {
    setShowMore(false);
    onNavigate(route);
  };

  return (
    <>
      {/* Mobile Drawer for "Más" */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end sm:hidden"
          onClick={() => setShowMore(false)}
        >
          <div
            className="bg-white rounded-t-2xl p-5 shadow-2xl border-t border-slate-200 max-h-[80vh] overflow-y-auto space-y-3"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-900 text-base">Otras secciones</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="grid grid-cols-1 gap-1 text-sm font-medium text-slate-800">
              <button
                onClick={() => handleSelect('/fuentes')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <Database className="w-4 h-4 text-slate-500" />
                <span>Fuentes y hemeroteca</span>
              </button>
              <button
                onClick={() => handleSelect('/comparar')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <Scale className="w-4 h-4 text-slate-500" />
                <span>Comparar dos partidos</span>
              </button>
              <button
                onClick={() => handleSelect('/relacion')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <BookMarked className="w-4 h-4 text-slate-500" />
                <span>Tu relación con la política</span>
              </button>
              <button
                onClick={() => handleSelect('/metodologia')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Cómo funciona (Metodología)</span>
              </button>
              <button
                onClick={() => handleSelect('/aviso-legal')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Aviso legal</span>
              </button>
              <button
                onClick={() => handleSelect('/privacidad')}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Privacidad</span>
              </button>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowMore(false);
                  onResetAnswers();
                }}
                className="w-full text-center py-2.5 px-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Borrar mis respuestas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.route === '/'
                ? currentRoute === '/'
                : currentRoute.startsWith(item.route);

            return (
              <button
                key={item.route}
                onClick={() => handleSelect(item.route)}
                className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                  isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              showMore ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
            aria-label="Más secciones"
          >
            <MoreHorizontal className="w-5 h-5 stroke-2" />
            <span className="text-[11px] mt-1 leading-none">Más</span>
          </button>
        </div>
      </nav>
    </>
  );
};
