import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { persistence } from '../services/persistence';

const WeeklyPlanner = () => {
  const [weeklyData, setWeeklyData] = React.useState(persistence.getWeeklyData());

  useEffect(() => {
    persistence.saveWeeklyData(weeklyData);
  }, [weeklyData]);

  const goals = {
    legumbres: { min: 2, max: 4 },
    pescado: { min: 2, max: 4 },
    carnesBlancas: { min: 2, max: 3 },
    huevos: { min: 3, max: 7 },
    frutosSecos: { min: 3, max: 7 },
    carnesRojas: { max: 2 },
  };

  const updateCount = (key, delta) => {
    setWeeklyData(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const getStatus = (key) => {
    const val = weeklyData[key];
    const goal = goals[key];
    if (key === 'carnesRojas') {
      return val > goal.max ? 'warning' : 'ok';
    }
    if (val < goal.min) return 'pending';
    if (val > goal.max) return 'excess';
    return 'ideal';
  };

  const sections = [
    { key: 'legumbres', label: 'Legumbres', sub: '2-4 veces/semana' },
    { key: 'pescado', label: 'Pescado', sub: '2-4 veces/semana' },
    { key: 'carnesBlancas', label: 'Carnes Blancas', sub: '2-3 veces/semana' },
    { key: 'huevos', label: 'Huevos', sub: '3-7 veces/semana' },
    { key: 'frutosSecos', label: 'Frutos Secos', sub: '3-7 veces/semana' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-2">
        <h2 className="text-3xl font-bold text-med-slate">Plan Semanal 📅</h2>
        <p className="text-med-slate/60">Equilibra tu semana con proteínas de calidad y grasas saludables.</p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section) => {
          const status = getStatus(section.key);
          return (
            <div key={section.key} className="bg-white p-5 rounded-2xl border border-med-blue-light card-shadow flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-med-slate">{section.label}</h3>
                <p className="text-sm text-med-slate/50">{section.sub}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-med-offwhite px-4 py-2 rounded-xl">
                  <button onClick={() => updateCount(section.key, -1)} className="text-med-terracotta font-bold text-xl px-2">-</button>
                  <span className="font-mono text-xl w-8 text-center">{weeklyData[section.key]}</span>
                  <button onClick={() => updateCount(section.key, 1)} className="text-med-olive font-bold text-xl px-2">+</button>
                </div>
                
                {status === 'ideal' && <CheckCircle2 className="text-med-olive" size={28} />}
                {status === 'pending' && <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200" />}
                {status === 'excess' && <AlertCircle className="text-amber-500" size={28} />}
              </div>
            </div>
          );
        })}

        {/* Alerta Carnes Rojas */}
        <div className={`p-6 rounded-2xl border transition-all ${
          getStatus('carnesRojas') === 'warning' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-med-offwhite border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`font-bold text-lg ${getStatus('carnesRojas') === 'warning' ? 'text-red-700' : 'text-med-slate'}`}>
                Carnes Rojas y Embutidos
              </h3>
              <p className="text-sm opacity-70">Consumo moderado: máximo 2 veces por semana</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => updateCount('carnesRojas', -1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border">-</button>
              <span className="font-bold text-xl">{weeklyData.carnesRojas}</span>
              <button onClick={() => updateCount('carnesRojas', 1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border">+</button>
            </div>
          </div>
          {getStatus('carnesRojas') === 'warning' && (
            <div className="mt-4 flex gap-2 items-center text-red-600 text-sm font-medium">
              <AlertCircle size={16} />
              <span>Has superado el límite recomendado para esta semana.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanner;
