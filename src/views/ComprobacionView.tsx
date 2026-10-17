import React, { useMemo, useState, useEffect } from 'react';
import { AppDatasets } from '../types/data';
import {
  validarDatos,
  valoresDePartido,
  calcularResultadosRegionales,
  repartoEntero,
  indicesRelacion,
  calcularResultados,
  Valor,
} from '../lib/motor';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatearFecha } from '../utils/date';

interface ComprobacionViewProps {
  datasets: AppDatasets;
}

export type EstadoPrueba = 'verde' | 'ambar' | 'rojo';

export interface TestResult {
  num: number;
  nombre: string;
  estado: EstadoPrueba;
  detalle: string;
}

export const ComprobacionView: React.FC<ComprobacionViewProps> = ({ datasets }) => {
  const {
    afirmacionesData,
    posicionesData,
    partidosData,
    contrasteData,
    fuentesData,
    provinciasData,
    relacionData,
  } = datasets;

  const afirmaciones = afirmacionesData.afirmaciones;
  const posiciones = posicionesData.posiciones;
  const partidos = partidosData.partidos;

  const [test7Result, setTest7Result] = useState<TestResult>({
    num: 7,
    nombre: 'Modo del servidor',
    estado: 'ambar',
    detalle: 'Comprobando cabecera Content-Security-Policy...',
  });

  const [test8Result, setTest8Result] = useState<TestResult>({
    num: 8,
    nombre: 'App instalable',
    estado: 'ambar',
    detalle: 'Comprobando manifiesto, iconos y service worker...',
  });

  useEffect(() => {
    fetch('/', { method: 'HEAD' })
      .then((res) => {
        const csp = res.headers.get('content-security-policy') || '';
        if (csp.includes("frame-ancestors 'none'")) {
          setTest7Result({
            num: 7,
            nombre: 'Modo del servidor',
            estado: 'verde',
            detalle: 'Producción: protecciones activas',
          });
        } else {
          setTest7Result({
            num: 7,
            nombre: 'Modo del servidor',
            estado: 'ambar',
            detalle:
              'Vista previa: protecciones relajadas. Es normal aquí; en la app publicada debe salir en verde',
          });
        }
      })
      .catch((_err) => {
        setTest7Result({
          num: 7,
          nombre: 'Modo del servidor',
          estado: 'ambar',
          detalle:
            'Vista previa: protecciones relajadas. Es normal aquí; en la app publicada debe salir en verde',
        });
      });

    // Prueba 8: Comprobar manifiesto, iconos y Service Worker
    async function checkPWA() {
      try {
        const manifestRes = await fetch('/manifest.webmanifest');
        if (!manifestRes.ok) throw new Error('Error cargando /manifest.webmanifest');
        const manifest = await manifestRes.json();
        if (!manifest.icons || manifest.icons.length === 0) throw new Error('Sin iconos en el manifiesto');

        const iconsToCheck = ['/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/icon.svg', '/apple-touch-icon.png'];
        await Promise.all(
          iconsToCheck.map(async (src) => {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`Fallo cargando icono ${src}`);
          })
        );

        let swActive = false;
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && (reg.active || navigator.serviceWorker.controller)) {
            swActive = true;
          }
        }

        if (swActive) {
          setTest8Result({
            num: 8,
            nombre: 'App instalable',
            estado: 'verde',
            detalle: 'Manifiesto e iconos verificados. Service worker activo y listo para funcionamiento sin conexión.',
          });
        } else {
          setTest8Result({
            num: 8,
            nombre: 'App instalable',
            estado: 'ambar',
            detalle: 'Manifiesto e iconos cargan correctamente. Service worker no registrado en la vista previa (se activa en la app compilada).',
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setTest8Result({
          num: 8,
          nombre: 'App instalable',
          estado: 'rojo',
          detalle: `Fallo en la configuración PWA: ${msg}`,
        });
      }
    }

    checkPWA();
  }, []);

  const testResults: TestResult[] = useMemo(() => {
    const list: TestResult[] = [];

    // Test 1: validarDatos
    const problemas = validarDatos(afirmaciones, posiciones);
    list.push({
      num: 1,
      nombre: 'validarDatos(afirmaciones, posiciones) devuelve una lista vacía',
      estado: problemas.length === 0 ? 'verde' : 'rojo',
      detalle:
        problemas.length === 0
          ? 'Sin problemas detectados en la coherencia de datos.'
          : `Problemas encontrados (${problemas.length}): ${problemas.join(', ')}`,
    });

    // Test 2: Las 40 afirmaciones tienen contexto
    const afirmacionesConContexto = afirmaciones.filter(
      (a) => typeof a.contexto === 'string' && a.contexto.trim().length > 0
    );
    list.push({
      num: 2,
      nombre: 'Las 40 afirmaciones tienen contexto',
      estado: afirmacionesConContexto.length === 40 ? 'verde' : 'rojo',
      detalle: `${afirmacionesConContexto.length} de ${afirmaciones.length} afirmaciones tienen contexto explicativo codificado.`,
    });

    // Test 3: Clones
    const partidosConTest = partidos.filter((p) => p.nivel === 1 && posiciones[p.id]);
    let clonesFallidos: string[] = [];
    for (const p of partidosConTest) {
      const respuestasClon = valoresDePartido(posiciones[p.id]);
      const prov = p.circunscripciones === 'todas' ? '28' : p.circunscripciones[0];
      const res = calcularResultadosRegionales(afirmaciones, respuestasClon, posiciones, partidos, prov);
      const elegibles = res.enTuProvincia.filter((r) => r.elegible);
      const target = elegibles.find((r) => r.partidoId === p.id);
      const maxAfinidad = Math.max(...elegibles.map((r) => r.afinidad as number));
      if (!target || target.afinidad === null || target.afinidad < maxAfinidad) {
        clonesFallidos.push(
          `${p.siglas} (afinidad clon: ${target?.afinidad?.toFixed(1) ?? 'null'}, max: ${maxAfinidad.toFixed(1)})`
        );
      }
    }
    list.push({
      num: 3,
      nombre: 'Prueba de clones para cada partido con posiciones',
      estado: clonesFallidos.length === 0 ? 'verde' : 'rojo',
      detalle:
        clonesFallidos.length === 0
          ? `Verificados ${partidosConTest.length} partidos. Cada partido responde con sus propias posturas y obtiene la afinidad máxima entre los elegibles.`
          : `Fallos en: ${clonesFallidos.join(', ')}`,
    });

    // Test 4: repartoEntero suma exactamente 100
    const resp1 = Object.fromEntries(afirmaciones.map((a) => [a.id, 1 as Valor]));
    const resp2 = Object.fromEntries(afirmaciones.map((a) => [a.id, -1 as Valor]));
    const resp3 = Object.fromEntries(afirmaciones.map((a, i) => [a.id, (i % 2 === 0 ? 2 : -2) as Valor]));

    const res1 = calcularResultados(afirmaciones, resp1, posiciones);
    const res2 = calcularResultados(afirmaciones, resp2, posiciones);
    const res3 = calcularResultados(afirmaciones, resp3, posiciones);

    const sum1 = Object.values(repartoEntero(res1)).reduce((s, x) => s + x, 0);
    const sum2 = Object.values(repartoEntero(res2)).reduce((s, x) => s + x, 0);
    const sum3 = Object.values(repartoEntero(res3)).reduce((s, x) => s + x, 0);

    const test4Ok = sum1 === 100 && sum2 === 100 && sum3 === 100;
    list.push({
      num: 4,
      nombre: 'El reparto de repartoEntero suma exactamente 100',
      estado: test4Ok ? 'verde' : 'rojo',
      detalle: `Sumas obtenidas: +1 a todo = ${sum1}, −1 a todo = ${sum2}, alternando +2 y −2 = ${sum3}.`,
    });

    // Test 5: indicesRelacion con valores exactos
    const ind1 = indicesRelacion(
      {
        democracia: 2,
        partidos: 1,
        gobierno: 3,
        oposicion: 2,
        representacion: 'ninguno',
        probabilidadVotar: 3,
        votoBlanco: 'si',
      },
      48
    );
    const v1 = [
      ind1.descontentoPolitica.valor,
      ind1.descontentoGobierno.valor,
      ind1.descontentoOposicion.valor,
      ind1.cercaniaAbstencion.valor,
      ind1.cercaniaVotoBlanco.valor,
    ];

    const ind2 = indicesRelacion(
      {
        democracia: 8,
        partidos: 7,
        gobierno: 7,
        oposicion: 4,
        representacion: 'si',
        probabilidadVotar: 10,
        votoBlanco: 'no',
      },
      85
    );
    const v2 = [
      ind2.descontentoPolitica.valor,
      ind2.descontentoGobierno.valor,
      ind2.descontentoOposicion.valor,
      ind2.cercaniaAbstencion.valor,
      ind2.cercaniaVotoBlanco.valor,
    ];

    const exp1 = [90, 70, 80, 76, 93];
    const exp2 = [17, 30, 60, 5, 0];
    const test5Ok =
      JSON.stringify(v1) === JSON.stringify(exp1) && JSON.stringify(v2) === JSON.stringify(exp2);

    list.push({
      num: 5,
      nombre: 'Prueba de cálculo exacto de indicesRelacion',
      estado: test5Ok ? 'verde' : 'rojo',
      detalle: test5Ok
        ? `Caso 1: [${v1.join(', ')}] coincide con [${exp1.join(', ')}]. Caso 2: [${v2.join(', ')}] coincide con [${exp2.join(', ')}].`
        : `Discrepancia. Obtenido 1: [${v1.join(', ')}], Obtenido 2: [${v2.join(', ')}]`,
    });

    // Test 6: URLs con https:// en fuentes.json
    const urlsNoHttps = fuentesData.fuentes.filter((f) => !f.url.startsWith('https://'));
    list.push({
      num: 6,
      nombre: 'Todas las URL de fuentes.json empiezan por https://',
      estado: urlsNoHttps.length === 0 ? 'verde' : 'rojo',
      detalle:
        urlsNoHttps.length === 0
          ? `Las ${fuentesData.fuentes.length} fuentes verificadas comienzan por https://.`
          : `${urlsNoHttps.length} fuentes no comienzan por https://.`,
    });

    return list;
  }, [afirmaciones, posiciones, partidos, fuentesData]);

  const allTestResults = useMemo(() => {
    return [...testResults, test7Result, test8Result];
  }, [testResults, test7Result, test8Result]);

  const hayRojos = allTestResults.some((t) => t.estado === 'rojo');

  const versionesFicheros = [
    { nombre: 'afirmaciones.json', version: afirmacionesData.version, fecha: formatearFecha(afirmacionesData.actualizado) },
    { nombre: 'posiciones.json', version: posicionesData.version, fecha: formatearFecha(posicionesData.actualizado) },
    { nombre: 'partidos.json', version: partidosData.version, fecha: formatearFecha(partidosData.actualizado) },
    { nombre: 'contraste.json', version: contrasteData.version, fecha: formatearFecha(contrasteData.actualizado) },
    { nombre: 'fuentes.json', version: fuentesData.version, fecha: formatearFecha(fuentesData.actualizado || fuentesData.generado) },
    { nombre: 'provincias.json', version: provinciasData.version, fecha: '—' },
    { nombre: 'relacion-politica.json', version: relacionData.version, fecha: '—' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Comprobación técnica del motor y datos
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Esta página ejecuta las pruebas automáticas del motor de cálculo, los ficheros de datos y la configuración del servidor.
        </p>
      </div>

      {/* Global Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center gap-3 ${
          !hayRojos
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900'
        }`}
      >
        {!hayRojos ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-700 flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-red-700 flex-shrink-0" />
        )}
        <div>
          <p className="font-bold text-base">
            {!hayRojos
              ? 'Todas las comprobaciones técnicas superadas'
              : 'Se han detectado errores en las comprobaciones'}
          </p>
          <p className="text-xs opacity-90 mt-0.5">
            {!hayRojos
              ? 'El motor de cálculo y los datos han superado todas las pruebas automáticas.'
              : 'Revisa el detalle de las pruebas para corregir las discrepancias.'}
          </p>
        </div>
      </div>

      {/* Test cases list */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
          Resultados de las pruebas
        </h2>

        <div className="space-y-3">
          {allTestResults.map((t) => {
            const isVerde = t.estado === 'verde';
            const isAmbar = t.estado === 'ambar';

            return (
              <div
                key={t.num}
                className={`p-4 rounded-xl border transition-all ${
                  isVerde
                    ? 'bg-white border-emerald-200 shadow-2xs'
                    : isAmbar
                    ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isVerde && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  {isAmbar && (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  {!isVerde && !isAmbar && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {t.num}. {t.nombre}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                          isVerde
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAmbar
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {isVerde ? 'Correcto' : isAmbar ? 'Aviso' : 'Fallo'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-mono">
                      {t.detalle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dataset Versions Table */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
          Versión y fecha de los ficheros de datos
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 border-b border-slate-200 font-semibold">Fichero</th>
                <th className="p-3 border-b border-slate-200 font-semibold">Versión</th>
                <th className="p-3 border-b border-slate-200 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versionesFicheros.map((f) => (
                <tr key={f.nombre} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">{f.nombre}</td>
                  <td className="p-3 text-slate-600 font-mono">{f.version}</td>
                  <td className="p-3 text-slate-600">{f.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
