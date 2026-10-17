import React, { useState, useEffect } from 'react';
import { AppDatasets, ProvinciaItem } from '../types/data';
import { Valor, MINIMO_RESPUESTAS, contarRespuestas } from '../lib/motor';
import {
  getStoredProvincia,
  setStoredProvincia,
  getStoredRespuestas,
  setStoredRespuesta,
  getStoredBloquesImportantes,
  setStoredBloquesImportantes,
  getStoredTestIndex,
  setStoredTestIndex,
} from '../services/storageService';
import { AvisosCompletos } from '../components/AvisosCompletos';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

interface TestViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

export const TestView: React.FC<TestViewProps> = ({ datasets, onNavigate }) => {
  const { afirmaciones, bloques } = datasets.afirmacionesData;
  const { provincias } = datasets.provinciasData;

  const [currentIndex, setCurrentIndex] = useState(() => getStoredTestIndex());
  const [respuestas, setRespuestas] = useState(() => getStoredRespuestas());
  const [provincia, setProvinciaState] = useState<string | null>(() => getStoredProvincia());
  const [bloquesImportantes, setBloquesImportantesState] = useState<string[]>(() =>
    getStoredBloquesImportantes()
  );

  const [mostrarContexto, setMostrarContexto] = useState(false);
  const [mostrarSelectorProvincia, setMostrarSelectorProvincia] = useState(!getStoredProvincia());
  const [busquedaProvincia, setBusquedaProvincia] = useState('');
  const [enPantallaPesos, setEnPantallaPesos] = useState(false);

  // Sync index to storage
  useEffect(() => {
    setStoredTestIndex(currentIndex);
  }, [currentIndex]);

  const respondidas = contarRespuestas(afirmaciones, respuestas);
  const puedeVerResultados = respondidas >= MINIMO_RESPUESTAS;

  const currentAfirmacion = afirmaciones[currentIndex] || afirmaciones[0];
  const bloqueActual = bloques.find((b) => b.id === currentAfirmacion.bloque);
  const currentRespuesta = respuestas[currentAfirmacion.id];

  const handleSeleccionarProvincia = (codigo: string | null) => {
    setProvinciaState(codigo);
    setStoredProvincia(codigo);
    setMostrarSelectorProvincia(false);
  };

  const handleResponder = (valor: Valor | null) => {
    const nuevas = setStoredRespuesta(currentAfirmacion.id, valor);
    setRespuestas({ ...nuevas });
    setMostrarContexto(false);

    if (currentIndex < afirmaciones.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Reached the end: open important topics step
      setEnPantallaPesos(true);
    }
  };

  const handleSaltar = () => {
    setMostrarContexto(false);
    if (currentIndex < afirmaciones.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setEnPantallaPesos(true);
    }
  };

  const handleAnterior = () => {
    setMostrarContexto(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const toggleBloqueImportante = (bloqueId: string) => {
    let actualizados: string[];
    if (bloquesImportantes.includes(bloqueId)) {
      actualizados = bloquesImportantes.filter((id) => id !== bloqueId);
    } else {
      if (bloquesImportantes.length >= 3) return; // Máximo 3
      actualizados = [...bloquesImportantes, bloqueId];
    }
    setBloquesImportantesState(actualizados);
    setStoredBloquesImportantes(actualizados);
  };

  const handleFinalizar = () => {
    onNavigate('/resultados');
  };

  const provinciasFiltradas = provincias.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProvincia.toLowerCase().trim())
  );

  const provinciaActual = provincias.find((p) => p.codigo === provincia);

  // Screen: Seleccionar temas importantes
  if (enPantallaPesos) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Temas más importantes para ti
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Opcional: elige hasta <strong>3 bloques temáticos</strong> que consideres prioritarios. Sus afirmaciones tendrán el doble de peso en el cálculo de afinidad.
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Seleccionados: {bloquesImportantes.length} de 3
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {bloques.map((b) => {
            const isSelected = bloquesImportantes.includes(b.id);
            const disabled = !isSelected && bloquesImportantes.length >= 3;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBloqueImportante(b.id)}
                disabled={disabled}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all min-h-[52px] ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-xs'
                    : disabled
                    ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
                }`}
              >
                <span className="text-sm">{b.nombre}</span>
                {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setEnPantallaPesos(false)}
            className="order-2 sm:order-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition-colors min-h-[44px]"
          >
            Volver a las afirmaciones
          </button>
          <button
            onClick={handleFinalizar}
            className="order-1 sm:order-2 flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-base transition-colors shadow-sm min-h-[48px]"
          >
            Ver mis resultados
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 1. Selector de provincia plegable */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-700 text-sm">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="font-medium text-slate-900">
              Circunscripción electoral:
            </span>
            <span className="font-semibold text-slate-800">
              {provinciaActual ? provinciaActual.nombre : 'No especificada'}
            </span>
          </div>

          <button
            onClick={() => setMostrarSelectorProvincia(!mostrarSelectorProvincia)}
            className="text-xs text-slate-600 hover:text-slate-900 underline font-medium p-1 cursor-pointer"
          >
            {mostrarSelectorProvincia ? 'Cerrar' : 'Cambiar'}
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-normal">
          Sirve para separar los partidos que se presentan en tu provincia de los que no. Opcional.
        </p>

        {mostrarSelectorProvincia && (
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={busquedaProvincia}
                onChange={(e) => setBusquedaProvincia(e.target.value)}
                placeholder="Buscar tu provincia..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              <button
                type="button"
                onClick={() => handleSeleccionarProvincia(null)}
                className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium transition-colors ${
                  provincia === null
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Prefiero no decirla (mostrar todas las opciones)
              </button>

              {provinciasFiltradas.map((p) => (
                <button
                  key={p.codigo}
                  type="button"
                  onClick={() => handleSeleccionarProvincia(p.codigo)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between ${
                    provincia === p.codigo
                      ? 'bg-slate-800 text-white font-medium'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{p.nombre}</span>
                  <span className="text-[11px] opacity-75">{p.diputados} diputados</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="uppercase tracking-wider">
            {bloqueActual?.nombre || 'Pregunta'}
          </span>
          <span>
            {currentIndex + 1} de {afirmaciones.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-slate-800 h-2 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / afirmaciones.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>{respondidas} respondidas de 40</span>
          {puedeVerResultados && (
            <button
              onClick={() => setEnPantallaPesos(true)}
              className="font-semibold text-slate-800 underline hover:text-black cursor-pointer"
            >
              Ver resultados ahora ({respondidas} resp.)
            </button>
          )}
        </div>
      </div>

      {/* Afirmación Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
          {currentAfirmacion.texto}
        </h2>

        {/* «¿Qué significa?» Dropdown */}
        {currentAfirmacion.contexto && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setMostrarContexto(!mostrarContexto)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                ¿Qué significa esta afirmación?
              </span>
              {mostrarContexto ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {mostrarContexto && (
              <div className="p-4 pt-2 border-t border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed bg-white">
                <p>{currentAfirmacion.contexto}</p>

                {currentAfirmacion.fuentesContexto && currentAfirmacion.fuentesContexto.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <p className="font-semibold text-slate-800">Fuentes de contexto:</p>
                    <ul className="space-y-1.5 pl-1">
                      {currentAfirmacion.fuentesContexto.map((fc, i) => (
                        <li key={i} className="leading-relaxed">
                          <a
                            href={fc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-800 underline hover:text-black inline break-words font-medium"
                          >
                            <span>{fc.titulo}</span>
                            {fc.fecha && <span className="text-slate-500 font-normal"> ({fc.fecha})</span>}
                            <ExternalLink className="w-3 h-3 inline-block ml-1 align-text-bottom flex-shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5 Response Buttons + "No sé" */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { valor: -2 as Valor, texto: 'Totalmente en desacuerdo' },
              { valor: -1 as Valor, texto: 'En desacuerdo' },
              { valor: 0 as Valor, texto: 'Neutral' },
              { valor: 1 as Valor, texto: 'De acuerdo' },
              { valor: 2 as Valor, texto: 'Totalmente de acuerdo' },
            ].map((opcion) => {
              const isSelected = currentRespuesta === opcion.valor;
              return (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => handleResponder(opcion.valor)}
                  className={`w-full py-3.5 px-3 rounded-xl border text-center font-medium text-sm transition-all min-h-[48px] flex items-center justify-center ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs scale-[1.01]'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {opcion.texto}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleResponder(null)}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-medium transition-colors min-h-[44px] ${
                currentRespuesta === null
                  ? 'border-slate-600 bg-slate-200 text-slate-900 font-bold'
                  : 'border-dashed border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              No sé / No tengo opinión en este tema
            </button>
          </div>
        </div>
      </div>

      {/* Navigation controls (Anterior, Saltar, Ver resultados) */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleAnterior}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaltar}
            className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
          >
            Saltar
            <ChevronRight className="w-4 h-4" />
          </button>

          {puedeVerResultados && (
            <button
              type="button"
              onClick={() => setEnPantallaPesos(true)}
              className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs min-h-[44px]"
            >
              Finalizar test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
