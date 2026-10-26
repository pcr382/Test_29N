import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, RotateCcw, ArrowRight } from 'lucide-react';
import { AppDatasets, AdivinaItem, AdivinaJson } from '../types/data';
import { loadAdivina } from '../services/dataService';
import { PartyDot } from '../components/PartyDot';
import { formatearFecha } from '../utils/date';

const POR_RONDA = 10;
const OPCIONES = 4;

function barajar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Pregunta {
  item: AdivinaItem;
  opciones: string[];
}

/** Una ronda: como mucho una frase por partido y 4 opciones (la buena y 3 al azar). */
function nuevaRonda(items: AdivinaItem[], partidoIds: string[]): Pregunta[] {
  const usados = new Set<string>();
  const ronda: AdivinaItem[] = [];
  for (const it of barajar(items)) {
    if (usados.has(it.partido)) continue;
    usados.add(it.partido);
    ronda.push(it);
    if (ronda.length === POR_RONDA) break;
  }
  return ronda.map((item) => ({
    item,
    opciones: barajar([
      item.partido,
      ...barajar(partidoIds.filter((id) => id !== item.partido)).slice(0, OPCIONES - 1),
    ]),
  }));
}

interface AdivinaViewProps {
  datasets: AppDatasets;
  onNavigate: (route: string) => void;
}

/** «Adivina de quién es»: propuestas reales para adivinar el partido. Todo ocurre en el dispositivo. */
export const AdivinaView: React.FC<AdivinaViewProps> = ({ datasets, onNavigate }) => {
  const partidos = datasets.partidosData.partidos;
  const porId = useMemo(() => new Map(partidos.map((p) => [p.id, p])), [partidos]);
  const ids = useMemo(() => partidos.map((p) => p.id), [partidos]);

  const [datos, setDatos] = useState<AdivinaJson | null>(null);
  const [error, setError] = useState(false);
  const [ronda, setRonda] = useState<Pregunta[]>([]);
  const [indice, setIndice] = useState(0);
  const [elegido, setElegido] = useState<string | null>(null);
  const [aciertos, setAciertos] = useState(0);

  const empezar = (d: AdivinaJson) => {
    setRonda(nuevaRonda(d.items.filter((i) => porId.has(i.partido)), ids));
    setIndice(0);
    setElegido(null);
    setAciertos(0);
  };

  const cargar = () => {
    setError(false);
    loadAdivina()
      .then((d) => {
        setDatos(d);
        empezar(d);
      })
      .catch(() => setError(true));
  };

  useEffect(cargar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cabecera = (
    <header className="space-y-1.5">
      <h1 className="text-2xl font-extrabold text-slate-900">Adivina de quién es</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        {datos?.aviso ?? 'Propuestas reales de los partidos, resumidas con nuestras palabras y con su fuente.'}
      </p>
    </header>
  );

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {cabecera}
        <p className="text-sm text-slate-700">No se han podido cargar las frases. Comprueba tu conexión.</p>
        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  if (!datos || ronda.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {cabecera}
        <p className="text-sm text-slate-500">Cargando las frases…</p>
      </div>
    );
  }

  const terminado = indice >= ronda.length;
  const pregunta = ronda[Math.min(indice, ronda.length - 1)];
  const real = porId.get(pregunta.item.partido)!;
  const acierto = elegido === pregunta.item.partido;

  const elegir = (id: string) => {
    if (elegido !== null) return;
    setElegido(id);
    if (id === pregunta.item.partido) setAciertos((a) => a + 1);
  };
  const siguiente = () => {
    setIndice((i) => i + 1);
    setElegido(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {cabecera}

      {!terminado ? (
        <section className="space-y-4" aria-label="Pregunta">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Frase {indice + 1} de {ronda.length}
              </span>
              <span>Aciertos: {aciertos}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-800 h-1.5 rounded-full transition-all" style={{ width: `${(indice / ronda.length) * 100}%` }} />
            </div>
          </div>

          <blockquote className="bg-white border border-slate-200 rounded-xl p-5 text-lg font-semibold text-slate-900 leading-snug break-words">
            {pregunta.item.texto}
          </blockquote>

          <p className="text-sm font-medium text-slate-700">¿De qué partido es?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {pregunta.opciones.map((id) => {
              const p = porId.get(id)!;
              const esBuena = id === pregunta.item.partido;
              const estado = elegido === null ? 'normal' : esBuena ? 'buena' : id === elegido ? 'fallada' : 'apagada';
              const estilo =
                estado === 'buena'
                  ? 'border-emerald-500 bg-emerald-50'
                  : estado === 'fallada'
                    ? 'border-rose-400 bg-rose-50'
                    : estado === 'apagada'
                      ? 'border-slate-200 bg-white opacity-60'
                      : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50';
              return (
                <button
                  key={id}
                  onClick={() => elegir(id)}
                  disabled={elegido !== null}
                  aria-pressed={elegido === id}
                  className={`flex items-center gap-2.5 w-full text-left p-3.5 min-h-[48px] border rounded-lg transition-colors min-w-0 ${estilo}`}
                >
                  <PartyDot color={p.color} />
                  <span className="font-semibold text-slate-900">{p.siglas}</span>
                  <span className="text-xs text-slate-500 truncate min-w-0 flex-1">{p.nombre !== p.siglas ? p.nombre : ''}</span>
                  {estado === 'buena' && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-label="Respuesta correcta" />}
                  {estado === 'fallada' && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" aria-label="Tu respuesta" />}
                </button>
              );
            })}
          </div>

          {elegido !== null && (
            <div aria-live="polite" className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
              <p className="font-bold text-slate-900">{acierto ? '¡Correcto!' : `No: es de ${real.siglas}.`}</p>
              {pregunta.item.contexto && <p className="text-xs text-slate-600">{pregunta.item.contexto}</p>}
              <a
                href={pregunta.item.fuente.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 text-xs text-slate-700 underline underline-offset-2 break-words"
              >
                <span>
                  Fuente: {pregunta.item.fuente.titulo}
                  {pregunta.item.fuente.fecha ? ` (${formatearFecha(pregunta.item.fuente.fecha)})` : ''}
                </span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
              </a>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={siguiente}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold min-h-[44px]"
                >
                  {indice + 1 < ronda.length ? 'Siguiente' : 'Ver el resultado'} <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/partido/' + real.id)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-lg text-sm font-medium min-h-[44px]"
                >
                  Ver la ficha de {real.siglas}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-slate-500">Resultado de la ronda</p>
          <p className="text-4xl font-extrabold text-slate-900">
            {aciertos} de {ronda.length}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Las propuestas no siempre son de quien parecen. En las fichas de los partidos puedes ver el resto de sus posturas, con sus fuentes.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <button
              onClick={() => empezar(datos)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" /> Jugar otra ronda
            </button>
            <button
              onClick={() => onNavigate('/partidos')}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 rounded-lg text-sm font-medium min-h-[44px]"
            >
              Ver los partidos
            </button>
          </div>
          <p className="text-xs text-slate-500">No guardamos tus respuestas: el juego funciona solo en tu dispositivo.</p>
        </section>
      )}
    </div>
  );
};
