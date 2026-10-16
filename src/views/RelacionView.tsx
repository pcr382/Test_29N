import React, { useState } from 'react';
import { AppDatasets } from '../types/data';
import {
  indicesRelacion,
  RespuestasRelacion,
  calcularResultadosRegionales,
  pesosPorBloques,
  contarRespuestas,
  MINIMO_RESPUESTAS,
} from '../lib/motor';
import {
  getStoredRelacion,
  setStoredRelacion,
  getStoredRespuestas,
  getStoredProvincia,
  getStoredBloquesImportantes,
  borrarMisRespuestas,
} from '../services/storageService';
import { BookMarked, ArrowRight, BookOpen, Trash2 } from 'lucide-react';

interface RelacionViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
  onResetAnswers: () => void;
}

export const RelacionView: React.FC<RelacionViewProps> = ({ datasets, onNavigate, onResetAnswers }) => {
  const { relacionData, afirmacionesData, posicionesData, partidosData } = datasets;
  const { preguntas, indices, aviso, enlaceGuia, intro, titulo } = relacionData;

  const [respuestas, setRespuestasState] = useState<RespuestasRelacion>(() => getStoredRelacion());

  // Calculate highest affinity if user completed the test
  const respuestasTest = getStoredRespuestas();
  const provinciaCodigo = getStoredProvincia();
  const bloques = getStoredBloquesImportantes();
  const countTest = contarRespuestas(afirmacionesData.afirmaciones, respuestasTest);

  let afinidadMaxima: number | null = null;
  if (countTest >= MINIMO_RESPUESTAS) {
    const pesos = pesosPorBloques(afirmacionesData.afirmaciones, bloques);
    const { enTuProvincia } = calcularResultadosRegionales(
      afirmacionesData.afirmaciones,
      respuestasTest,
      posicionesData.posiciones,
      partidosData.partidos,
      provinciaCodigo,
      pesos
    );
    const elegibles = enTuProvincia.filter((r) => r.elegible && r.afinidad !== null);
    if (elegibles.length > 0) {
      afinidadMaxima = Math.max(...elegibles.map((r) => r.afinidad as number));
    }
  }

  const handleUpdate = (id: keyof RespuestasRelacion, val: any) => {
    const updated = { ...respuestas, [id]: val };
    setRespuestasState(updated);
    setStoredRelacion(updated);
  };

  const resultados = indicesRelacion(respuestas, afinidadMaxima);

  const hayAlgunaRespuesta = Object.values(respuestas).some((v) => v !== undefined && v !== null);

  const NIVEL_COLORES = {
    bajo: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    medio: 'bg-amber-50 text-amber-800 border-amber-200',
    alto: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {titulo || 'Tu relación con la política'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {intro ||
            'Siete preguntas opcionales para situarte ante la política en general. No cuentan para tu afinidad con los partidos y no salen de tu dispositivo.'}
        </p>
      </div>

      {/* 7 Questions */}
      <div className="space-y-6">
        {preguntas.map((p, idx) => {
          const key = p.id as keyof RespuestasRelacion;
          const currentVal = respuestas[key];

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 rounded px-2 py-0.5 mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-1 flex-1">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {p.texto || p.pregunta}
                  </h2>
                  {p.ayuda && <p className="text-xs text-slate-500">{p.ayuda}</p>}
                </div>
              </div>

              {/* Scale 0 to 10 question */}
              {p.tipo === 'escala' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }).map((_, i) => {
                      const isSelected = currentVal === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleUpdate(key, i)}
                          className={`py-2 rounded-lg font-bold text-xs sm:text-sm border transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1">
                    <span>0: Nada</span>
                    <span>10: Mucho / Totalmente</span>
                  </div>
                </div>
              )}

              {/* Categorical options question */}
              {p.tipo === 'opciones' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {(
                    p.opciones || [
                      { valor: 'si', texto: 'Sí' },
                      { valor: 'en-parte', texto: 'En parte' },
                      { valor: 'ninguno', texto: 'Ninguno' },
                    ]
                  ).map((opt) => {
                    const isSelected = currentVal === opt.valor;
                    return (
                      <button
                        key={String(opt.valor)}
                        type="button"
                        onClick={() => handleUpdate(key, opt.valor)}
                        className={`p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all min-h-[44px] ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt.texto}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* "Prefiero no contestar" */}
              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={() => handleUpdate(key, null)}
                  className={`text-xs underline hover:text-slate-900 transition-colors p-1 ${
                    currentVal === null ? 'font-bold text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Prefiero no contestar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calculated Indices Section */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Tus cinco índices</h2>
          <p className="text-xs text-slate-600">
            Valores orientativos de 0 a 100 calculados a partir de tus respuestas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(
            [
              'descontentoPolitica',
              'descontentoGobierno',
              'descontentoOposicion',
              'cercaniaAbstencion',
              'cercaniaVotoBlanco',
            ] as const
          ).map((indiceKey) => {
            const dataIndice = resultados[indiceKey];
            const cfg = indices[indiceKey];
            const nivel = dataIndice.nivel;

            return (
              <div
                key={indiceKey}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {cfg?.titulo || indiceKey}
                    </h3>
                    {nivel && (
                      <span
                        className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${
                          NIVEL_COLORES[nivel]
                        }`}
                      >
                        Nivel {nivel}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {dataIndice.valor !== null ? `${dataIndice.valor}` : '—'}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                      / 100
                    </span>
                  </div>
                </div>

                {/* Bar */}
                {dataIndice.valor !== null && (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-2 rounded-full"
                      style={{ width: `${dataIndice.valor}%` }}
                    />
                  </div>
                )}

                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  <strong>Fórmula:</strong> {cfg?.formula}
                </p>
              </div>
            );
          })}
        </div>

        {/* Aviso y enlace a guía */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-600">
          <p className="leading-relaxed">
            {aviso ||
              'Estos índices resumen lo que has contestado. No son una predicción y no se comparan con nadie, porque la app no guarda las respuestas de nadie.'}
          </p>

          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => onNavigate('/como-se-vota')}
              className="text-slate-900 font-semibold underline inline-flex items-center gap-1 hover:text-black"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {enlaceGuia?.texto ||
                  'Si dudas entre votar en blanco, nulo o no votar, en «Cómo se vota» se explica qué efecto tiene cada opción.'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => onNavigate('/resultados')}
          className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors text-center min-h-[44px]"
        >
          Volver a resultados del test
        </button>

        <button
          onClick={() => onNavigate('/como-se-vota')}
          className="py-3 px-4 bg-white border border-slate-300 text-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center min-h-[44px]"
        >
          Ir a «Cómo se vota»
        </button>
      </div>
    </div>
  );
};
