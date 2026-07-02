import React, { useState, Suspense, lazy, useEffect } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import Header from './components/Header';
import Login from './components/Login';
import { persistence } from './services/persistence';
import coverImage from '../caratula.jpg';
import { openTutorial } from './utils/tutorial';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Calendar = lazy(() => import('./components/Calendar'));
const WeeklyPlanner = lazy(() => import('./components/WeeklyPlanner'));
const FoodCatalog = lazy(() => import('./components/FoodCatalog'));
const WeightTracker = lazy(() => import('./components/WeightTracker'));
const Backup = lazy(() => import('./components/Backup'));

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasEnteredApp, setHasEnteredApp] = useState(false);

  useEffect(() => {
    // Check authentication status on app load
    const auth = persistence.getAuth();
    setIsAuthenticated(!!auth);
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = (authData) => {
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'weight':
        return <WeightTracker />;
      case 'calendar':
        return <Calendar />;
      case 'planner':
        return <WeeklyPlanner />;
      case 'foods':
        return <FoodCatalog />;
      case 'backup':
        return <Backup />;
      default:
        return <Dashboard />;
    }
  };

  if (!hasEnteredApp) {
    return (
      <div className="min-h-screen bg-med-cream px-4 py-6 sm:px-6 sm:py-10">
        <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl shadow-slate-200/70 sm:min-h-[calc(100vh-5rem)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="min-h-[46vh] bg-[#38aaa0] lg:min-h-full">
            <img
              src={coverImage}
              alt="Carátula del tutorial Vida Mediterránea 2026"
              className="h-full min-h-[46vh] w-full object-cover object-top lg:min-h-full"
            />
          </section>

          <section className="flex flex-1 flex-col justify-center gap-8 px-6 py-8 sm:px-10 lg:px-12">
            <div className="space-y-4">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-med-olive">
                Vida Mediterránea
              </p>
              <h1 className="text-3xl font-black leading-tight text-med-slate sm:text-4xl">
                Antes de empezar
              </h1>
              <p className="max-w-lg text-lg font-semibold leading-relaxed text-slate-500">
                Consulta el tutorial con las instrucciones para manejar la aplicación y sacar partido a todas sus funciones.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openTutorial}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-med-olive px-6 py-3 text-base font-black text-med-olive transition-all hover:bg-med-olive hover:text-white focus:outline-none focus:ring-4 focus:ring-med-olive/20"
              >
                <BookOpen size={21} />
                Ver tutorial
              </button>
              <button
                type="button"
                onClick={() => setHasEnteredApp(true)}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-med-slate px-6 py-3 text-base font-black text-white shadow-xl shadow-med-slate/15 transition-all hover:bg-med-terracotta focus:outline-none focus:ring-4 focus:ring-med-terracotta/20 active:scale-[0.98]"
              >
                Entrar a la aplicación
                <ArrowRight size={21} />
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isCheckingAuth && !isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-med-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-med-olive mx-auto mb-4"></div>
          <p className="text-med-slate font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-med-cream pb-12">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onOpenTutorial={openTutorial} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Cargando sección…</div>}>
          {renderContent()}
        </Suspense>
      </main>
      
      {/* Decorative background elements */}
      <div className="fixed top-20 left-[-10%] w-[40%] h-[40%] bg-med-blue/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed bottom-10 right-[-10%] w-[40%] h-[40%] bg-med-terracotta/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
}

export default App;
