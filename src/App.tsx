import React, { useState, useEffect } from 'react';
import { loadAppDatasets } from './services/dataService';
import { AppDatasets } from './types/data';
import { getStoredProvincia, borrarMisRespuestas } from './services/storageService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NavBottom } from './components/NavBottom';
import { InicioView } from './views/InicioView';
import { TestView } from './views/TestView';
import { ResultadosView } from './views/ResultadosView';
import { PartidosView } from './views/PartidosView';
import { PartidoDetalleView } from './views/PartidoDetalleView';
import { CompararView } from './views/CompararView';
import { ComoSeVotaView } from './views/ComoSeVotaView';
import { FuentesView } from './views/FuentesView';
import { RelacionView } from './views/RelacionView';
import { ContenidoMarkdownView } from './views/ContenidoMarkdownView';
import { ComprobacionView } from './views/ComprobacionView';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  const [datasets, setDatasets] = useState<AppDatasets | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<string>(() => window.location.hash.slice(1) || '/');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Hash change listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setRoute(hash);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newRoute: string) => {
    window.location.hash = newRoute;
    setRoute(newRoute);
    window.scrollTo(0, 0);
  };

  const handleResetAnswers = () => {
    borrarMisRespuestas();
    setRefreshKey((k) => k + 1);
  };

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAppDatasets(force);
      setDatasets(data);
    } catch (err) {
      console.error('Error cargando datos de Test 29N:', err);
      setError(
        'No se han podido descargar los datos del test desde el servidor. Por favor, comprueba tu conexión y vuelve a intentarlo.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-xs text-center space-y-4">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h1 className="font-bold text-slate-900 text-lg">Test 29N</h1>
            <p className="text-xs text-slate-600">
              Cargando afirmaciones, programas y posturas parlamentarias...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !datasets) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-bold text-slate-900 text-lg">Error al cargar los datos</h1>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => loadData(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  // Get selected province for header badge
  const provinciaCodigo = getStoredProvincia();
  const provinciaActual = datasets.provinciasData.provincias.find(
    (p) => p.codigo === provinciaCodigo
  );

  // Router matching
  const renderCurrentView = () => {
    if (route === '/' || route === '') {
      return <InicioView datasets={datasets} onNavigate={navigate} key={refreshKey} />;
    }
    if (route === '/test') {
      return <TestView datasets={datasets} onNavigate={navigate} key={refreshKey} />;
    }
    if (route === '/resultados') {
      return (
        <ResultadosView
          datasets={datasets}
          onNavigate={navigate}
          onResetAnswers={handleResetAnswers}
          key={refreshKey}
        />
      );
    }
    if (route === '/partidos') {
      return <PartidosView datasets={datasets} onNavigate={navigate} key={refreshKey} />;
    }
    if (route.startsWith('/partido/')) {
      const partidoId = route.replace('/partido/', '');
      return (
        <PartidoDetalleView
          partidoId={partidoId}
          datasets={datasets}
          onNavigate={navigate}
          key={partidoId + refreshKey}
        />
      );
    }
    if (route === '/comparar') {
      return <CompararView datasets={datasets} key={refreshKey} />;
    }
    if (route === '/como-se-vota') {
      return <ComoSeVotaView datasets={datasets} key={refreshKey} />;
    }
    if (route === '/fuentes') {
      return <FuentesView datasets={datasets} onNavigate={navigate} key={refreshKey} />;
    }
    if (route === '/relacion') {
      return (
        <RelacionView
          datasets={datasets}
          onNavigate={navigate}
          onResetAnswers={handleResetAnswers}
          key={refreshKey}
        />
      );
    }
    if (route === '/metodologia') {
      return (
        <ContenidoMarkdownView
          filename="metodologia.md"
          tituloFallback="Cómo funciona el test (Metodología)"
        />
      );
    }
    if (route === '/aviso-legal') {
      return (
        <ContenidoMarkdownView filename="aviso-legal.md" tituloFallback="Aviso legal" />
      );
    }
    if (route === '/privacidad') {
      return (
        <ContenidoMarkdownView filename="privacidad.md" tituloFallback="Política de privacidad" />
      );
    }
    if (route === '/comprobacion') {
      return <ComprobacionView datasets={datasets} />;
    }

    // Fallback to Inicio
    return <InicioView datasets={datasets} onNavigate={navigate} key={refreshKey} />;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
      <Header
        currentRoute={route}
        onNavigate={navigate}
        provinciaNombre={provinciaActual?.nombre}
      />

      <main className="flex-1 w-full">
        <ErrorBoundary onNavigateHome={() => navigate('/')} resetKey={`${route}:${refreshKey}`}>
          {renderCurrentView()}
        </ErrorBoundary>
      </main>

      <Footer onResetAnswers={handleResetAnswers} onNavigate={navigate} />

      <NavBottom
        currentRoute={route}
        onNavigate={navigate}
        onResetAnswers={handleResetAnswers}
      />
    </div>
  );
}

export default App;
