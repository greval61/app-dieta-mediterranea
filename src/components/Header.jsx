import React, { useState, useEffect } from 'react';
import { Leaf, Cloud, CloudOff, BookOpen } from 'lucide-react';
import { persistence } from '../services/persistence';

const Header = ({ activeTab, setActiveTab, onOpenTutorial }) => {
  const [isOnline, setIsOnline] = useState(persistence.isOnline);

  useEffect(() => {
    const check = async () => {
      const status = await persistence.checkConnection();
      setIsOnline(status);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Hoy' },
    { id: 'weight', label: 'Peso' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'foods', label: 'Catálogo' },
    { id: 'planner', label: 'Semana' },
    { id: 'backup', label: 'Copias' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-med-blue-light">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <div className="bg-med-olive p-2 rounded-xl">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-med-slate hidden sm:block">Vida Mediterránea</h1>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isOnline ? <Cloud size={12} /> : <CloudOff size={12} />}
              <span>{isOnline ? 'Nube' : 'Local'}</span>
            </div>
          </div>
          
          <nav className="flex gap-1 overflow-x-auto max-w-[70vw] sm:max-w-none scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-med-olive text-white shadow-md'
                    : 'text-med-slate/60 hover:bg-med-blue-light hover:text-med-slate'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenTutorial}
              className="flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-med-olive hover:bg-med-olive/10 transition-all"
              title="Abrir tutorial"
            >
              <BookOpen size={16} />
              <span>Tutorial</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
