import React, { useState, Suspense, lazy, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import { persistence } from './services/persistence';

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
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
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