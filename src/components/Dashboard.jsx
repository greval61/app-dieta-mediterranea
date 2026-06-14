import React, { useState, useEffect } from 'react';
import { Sun, Utensils, Coffee, Moon, Plus, Trash2, Search, ChevronRight, Scale, Target, Settings2, Copy, Download, Upload } from 'lucide-react';
import { meals } from '../data/foods';
import AddFoodModal from './AddFoodModal';
import { persistence } from '../services/persistence';

const getLocalDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Dashboard = () => {
  const [dailyLog, setDailyLog] = useState({
    breakfast: [], lunch: [], snack: [], dinner: [],
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMeal, setActiveMeal] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState('');
  const [foodCatalog, setFoodCatalog] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  const defaultGoals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    profile: {
      weight: 70,
      age: 30,
      sex: 'female',
      height: 165,
      activity: 'moderate',
      objective: 'maintain'
    }
  };

  const [goals, setGoals] = useState(() => {
    const stored = persistence.getGoals();
    return {
      ...defaultGoals,
      ...stored,
      profile: {
        ...defaultGoals.profile,
        ...(stored.profile || {})
      }
    };
  });

  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const objectiveAdjustments = {
    lose: -400,
    maintain: 0,
    gain: 250,
  };

  const calculateBMR = ({ weight, height, age, sex }) => {
    const w = Number(weight) || 0;
    const h = Number(height) || 0;
    const a = Number(age) || 0;
    if (!w || !h || !a) return 0;
    return 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
  };

  const calculateGoalsFromProfile = (profile) => {
    const weight = Number(profile.weight) || 0;
    const bmr = calculateBMR(profile);
    const activity = activityFactors[profile.activity] || activityFactors.moderate;
    const adjustment = objectiveAdjustments[profile.objective] ?? 0;
    const tdee = Math.max(1200, Math.round(bmr * activity + adjustment));
    const proteinMultiplier = profile.objective === 'lose'
      ? 2.0
      : profile.objective === 'gain'
      ? 2.2
      : 1.8;
    const protein = Math.max(0, Math.round((proteinMultiplier * weight) * 10) / 10);
    const fat = Math.max(0, Math.round(((tdee * 0.25) / 9) * 10) / 10);
    const carbs = Math.max(0, Math.round(((tdee - protein * 4 - fat * 9) / 4) * 10) / 10);

    return {
      calories: tdee,
      protein,
      carbs,
      fat,
    };
  };

  const computedGoals = calculateGoalsFromProfile(goals.profile);

  const displayGoals = {
    ...goals,
    ...computedGoals,
  };

  const todayStr = getLocalDateStr();

  useEffect(() => {
    fetchLogs();
    fetchCatalog();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await persistence.getLogs(todayStr);
      const organized = {
        breakfast: data.filter(l => l.meal_id === 'breakfast'),
        lunch: data.filter(l => l.meal_id === 'lunch'),
        snack: data.filter(l => l.meal_id === 'snack'),
        dinner: data.filter(l => l.meal_id === 'dinner'),
      };
      setDailyLog(organized);
      setApiError(null);
    } catch (error) {
      setApiError('No se pudieron cargar los registros. La aplicación funcionará en modo local.');
    }
  };

  const fetchCatalog = async (search = '') => {
    try {
      const data = await persistence.getFoods(search);
      setFoodCatalog(data);
      setApiError(null);
    } catch (error) {
      setApiError('No se pudo cargar el catálogo. Usando datos locales.');
      setFoodCatalog([]);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (activeMeal) fetchCatalog(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, activeMeal]);

  const addFoodToMeal = async () => {
    if (!selectedFood || !amount || !activeMeal) return;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setApiError('Introduce una cantidad válida (mayor que 0).');
      return;
    }

    const isWeightBased = Number(selectedFood.is_weight_based) === 1;
    const factor = isWeightBased ? (parsedAmount / 100) : parsedAmount;

    setIsSaving(true);
    setApiError(null);
    try {
      await persistence.saveLog({
        date: todayStr,
        meal_id: activeMeal,
        food_id: selectedFood.id,
        name: selectedFood.name,
        amount: parsedAmount,
        calories: selectedFood.calories * factor,
        protein: selectedFood.protein * factor,
        carbs: selectedFood.carbs * factor,
        fat: selectedFood.fat * factor,
        sugar: selectedFood.sugar * factor,
        unit_label: isWeightBased ? 'g' : 'unid.'
      });

      await fetchLogs();
      resetAddUI();
    } catch (error) {
      setApiError(`No se pudo añadir el alimento: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddUI = () => {
    setSearchTerm('');
    setActiveMeal(null);
    setSelectedFood(null);
    setAmount('');
    setShowAddFoodModal(false);
  };

  const handleFoodCreated = async (newFood) => {
    await fetchCatalog('');
    setSelectedFood(newFood);
    setSearchTerm('');
    setApiError(null);
  };

  const removeFoodFromMeal = async (id) => {
    try {
      await persistence.deleteLog(id, todayStr);
      fetchLogs();
    } catch (error) {
      console.error('Error removing food:', error);
    }
  };

  const copyYesterdayMeal = async (mealId) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    setIsSaving(true);
    try {
      const yesterdayLogs = await persistence.getLogs(yesterdayStr);
      const filtered = yesterdayLogs.filter(l => l.meal_id === mealId);

      if (filtered.length === 0) {
        alert('No hay registros de ayer para esta comida.');
        return;
      }

      for (const log of filtered) {
        await persistence.saveLog({
          ...log,
          id: null, // Generar nuevo ID
          date: todayStr
        });
      }
      await fetchLogs();
    } catch (error) {
      setApiError('No se pudo copiar la comida de ayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = persistence.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `app_dieta_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar los datos: ' + err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const success = persistence.importData(evt.target.result);
      if (success) {
        alert('¡Datos importados con éxito! La página se recargará para aplicar los cambios.');
        window.location.reload();
      } else {
        alert('Error al importar el archivo. Verifica que sea un archivo de copia de seguridad válido.');
      }
    };
    reader.readAsText(file);
  };

  const calculateTotals = (items) => {
    return items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      sugar: acc.sugar + item.sugar,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });
  };

  const dayTotals = calculateTotals(Object.values(dailyLog).flat());
  const todayFormatted = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' 
  });

  const mealIcons = { breakfast: Sun, lunch: Utensils, snack: Coffee, dinner: Moon };

  const GoalCard = ({ label, value, goal, color, unit = 'g' }) => {
    const percentage = Math.min(100, (value / goal) * 100);
    const isOver = value > goal;
    
    return (
      <div className={`p-4 rounded-2xl border transition-all ${
        isOver ? 'bg-red-50 border-red-100' : 'bg-white border-med-blue-light'
      } card-shadow`}>
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] font-black uppercase ${
            isOver ? 'text-red-400' : 'text-slate-400'
          }`}>{label}</span>
          <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-end gap-1 mb-2">
          <span className={`text-xl font-black ${
            isOver ? 'text-red-700' : 'text-med-slate'
          }`}>{value.toFixed(1)}</span>
          <span className="text-xs font-bold text-slate-400 pb-1">{unit}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-[9px] font-bold text-slate-400">Meta: {goal}{unit}</span>
          <span className={`text-[9px] font-bold ${isOver ? 'text-red-600' : 'text-med-olive'}`}>
            {isOver ? `+${(value - goal).toFixed(1)}` : `${(goal - value).toFixed(1)} faltan`}
          </span>
        </div>
      </div>
    );
  };

  const MacroBadge = ({ label, value, color }) => (
    <div className={`px-2 py-1 rounded-lg ${color} text-[9px] font-bold uppercase tracking-wider flex flex-col items-center min-w-[50px]`}>
      <span className="opacity-70">{label}</span>
      <span className="text-xs">{value.toFixed(1)}g</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {showGoalsModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 bg-med-slate/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-3xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-med-olive/10 text-med-olive px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                  <Target size={14} /> Objetivos diarios
                </div>
                <div>
                  <h3 className="text-2xl font-black text-med-slate">Perfil y necesidades</h3>
                  <p className="text-sm text-slate-500">Actualiza tu perfil para recalcular calorías y macros automáticamente.</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoalsModal(false)}
                className="text-slate-400 hover:text-med-terracotta text-3xl leading-none"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Peso (kg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={goals.profile.weight}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, weight: Number(e.target.value) }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Altura (cm)</label>
                    <input
                      type="number"
                      placeholder="170"
                      value={goals.profile.height}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, height: Number(e.target.value) }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Edad</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={goals.profile.age}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, age: Number(e.target.value) }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Sexo</label>
                    <select
                      value={goals.profile.sex}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, sex: e.target.value }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    >
                      <option value="female">Femenino</option>
                      <option value="male">Masculino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Actividad física</label>
                    <select
                      value={goals.profile.activity}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, activity: e.target.value }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    >
                      <option value="sedentary">Sedentario</option>
                      <option value="light">Ligera</option>
                      <option value="moderate">Moderada</option>
                      <option value="active">Activa</option>
                      <option value="very_active">Muy activa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Objetivo</label>
                    <select
                      value={goals.profile.objective}
                      onChange={(e) => setGoals({
                        ...goals,
                        profile: { ...goals.profile, objective: e.target.value }
                      })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-med-slate outline-none transition focus:border-med-olive focus:bg-white"
                    >
                      <option value="lose">Perder peso</option>
                      <option value="maintain">Mantener peso</option>
                      <option value="gain">Ganar músculo</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-3">Visualización instantánea</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-150">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-2">Calorías</p>
                      <p className="text-2xl font-black text-med-slate">{displayGoals.calories.toFixed(0)}</p>
                      <span className="text-[10px] text-slate-400">kcal</span>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-150">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-2">Proteínas</p>
                      <p className="text-2xl font-black text-blue-700">{displayGoals.protein.toFixed(1)} g</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-150">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-2">Carbs</p>
                      <p className="text-2xl font-black text-amber-700">{displayGoals.carbs.toFixed(1)} g</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 text-center shadow-sm border border-slate-150 col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-2">Grasas</p>
                      <p className="text-2xl font-black text-red-700">{displayGoals.fat.toFixed(1)} g</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[2rem] border border-med-blue-light/60 bg-med-olive/5 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.3em] font-black text-med-olive mb-3">Resumen</p>
                  <p className="text-sm text-slate-600 leading-6">Tus metas se recalculan cada vez que cambias peso, edad, altura, sexo, nivel de actividad u objetivo. Guarda los cambios para que el APK use siempre la versión actual.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase tracking-[0.28em] font-bold">
                    <span>Objetivo</span>
                    <span>{goals.profile.objective === 'lose' ? 'Déficit' : goals.profile.objective === 'gain' ? 'Superávit' : 'Estable'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase tracking-[0.28em] font-bold">
                    <span>Factor de actividad</span>
                    <span>{goals.profile.activity.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase tracking-[0.28em] font-bold">
                    <span>BMR estimado</span>
                    <span>{calculateBMR(goals.profile).toFixed(0)} kcal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Copia de seguridad</p>
                  <p className="text-[11px] text-slate-500">Guarda o restablece tus metas cuando lo necesites.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-xs font-bold text-med-slate shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <Download size={14} className="mr-2 text-med-olive" /> Exportar
                  </button>
                  <label className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-xs font-bold text-med-slate shadow-sm ring-1 ring-slate-200 cursor-pointer transition hover:bg-slate-100">
                    <Upload size={14} className="mr-2 text-med-olive" /> Importar
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                const saved = {
                  ...goals,
                  ...computedGoals,
                  profile: { ...goals.profile }
                };
                persistence.saveGoals(saved);
                setGoals(saved);
                setShowGoalsModal(false);
              }}
              className="mt-4 w-full rounded-[1.5rem] bg-med-olive py-4 text-sm font-black text-white shadow-lg shadow-med-olive/15 transition hover:bg-med-slate"
            >
              Guardar perfil y cerrar
            </button>
          </div>
        </div>
      )}
      <AddFoodModal
        isOpen={showAddFoodModal}
        initialName={searchTerm}
        onClose={() => setShowAddFoodModal(false)}
        onSaved={handleFoodCreated}
      />
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {apiError}
        </div>
      )}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-med-slate capitalize">{todayFormatted}</h2>
            <p className="text-med-slate/60 text-lg">Resumen nutricional basado en peso</p>
            <p className="text-sm text-slate-400">Toca el cuadro de Total Diario para editar tu edad, sexo, altura, actividad y objetivo.</p>
          </div>
          <button 
            onClick={() => setShowGoalsModal(true)}
            className="bg-white px-8 py-6 rounded-3xl border border-med-blue-light card-shadow text-center min-w-[200px] group hover:border-med-olive transition-all relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 text-slate-300 group-hover:text-med-olive transition-colors">
              <Settings2 size={16} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Diario</span>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-5xl font-black transition-colors ${
                dayTotals.calories > displayGoals.calories ? 'text-red-600' : 'text-med-olive'
              }`}>{dayTotals.calories.toFixed(0)}</span>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-400 block">/ {displayGoals.calories}</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase">kcal</span>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GoalCard 
            label="Proteínas" 
            value={dayTotals.protein} 
            goal={displayGoals.protein} 
            color="bg-blue-500" 
          />
          <GoalCard 
            label="Hidratos" 
            value={dayTotals.carbs} 
            goal={displayGoals.carbs} 
            color="bg-amber-500" 
          />
          <GoalCard 
            label="Grasas" 
            value={dayTotals.fat} 
            goal={displayGoals.fat} 
            color="bg-red-500" 
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {meals.map((meal) => {
          const Icon = mealIcons[meal.id];
          const mealLogs = dailyLog[meal.id];
          const mealTotals = calculateTotals(mealLogs);
          const isAdding = activeMeal === meal.id;

          return (
            <div key={meal.id} className={`bg-white rounded-3xl border border-med-blue-light card-shadow transition-all ${isAdding ? 'overflow-visible z-20 relative' : 'overflow-hidden'}`}>
              <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between md:items-center bg-med-offwhite/30 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-med-olive">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-med-slate">{meal.name}</h3>
                    <p className="text-sm text-slate-400 font-medium">{mealLogs.length} alimentos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyYesterdayMeal(meal.id)}
                    className="p-2 text-slate-400 hover:text-med-olive transition-colors"
                    title="Copiar lo de ayer"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setActiveMeal(meal.id);
                      setShowAddFoodModal(true);
                    }}
                    className="p-2 bg-med-olive text-white rounded-xl shadow-lg shadow-med-olive/20 hover:scale-110 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                  <MacroBadge label="Prot" value={mealTotals.protein} color="bg-blue-100 text-blue-700" />
                  <MacroBadge label="HC" value={mealTotals.carbs} color="bg-amber-100 text-amber-700" />
                  <MacroBadge label="Grasa" value={mealTotals.fat} color="bg-red-100 text-red-700" />
                  <div className="ml-4 pl-4 border-l border-slate-200 text-right">
                    <span className="text-2xl font-black text-med-slate">{mealTotals.calories.toFixed(0)}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">kcal</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {mealLogs.length > 0 ? (
                  <div className="space-y-3">
                    {mealLogs.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-med-offwhite/50 rounded-2xl group transition-all hover:bg-med-offwhite gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-med-olive" />
                          <div>
                            <p className="font-bold text-med-slate">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.amount}{item.unit_label || item.unit || ''}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex gap-2">
                            <span className="text-[10px] text-slate-500">P: {item.protein.toFixed(1)}g</span>
                            <span className="text-[10px] text-slate-500">H: {item.carbs.toFixed(1)}g</span>
                            <span className="text-[10px] text-slate-500">G: {item.fat.toFixed(1)}g</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-med-slate text-sm">{item.calories.toFixed(0)} <span className="text-[8px] uppercase text-slate-400 font-bold">kcal</span></span>
                            <button onClick={() => removeFoodFromMeal(item.id)} className="text-slate-300 hover:text-med-terracotta opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-slate-400 italic text-sm">Sin registros</p>
                )}

                <div className={`pt-2 ${isAdding ? 'relative z-30' : ''}`}>
                  {isAdding ? (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      {!selectedFood ? (
                        <div className="relative z-50">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Buscar alimento (ej. leche, pan, huevo)..."
                            className="w-full pl-12 pr-4 py-4 bg-med-offwhite border-2 border-med-olive/20 rounded-2xl focus:border-med-olive outline-none transition-all text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {foodCatalog.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white border-2 border-med-olive/30 shadow-2xl rounded-2xl z-[200] max-h-[min(24rem,70vh)] min-h-[14rem] overflow-y-auto">
                              <p className="sticky top-0 bg-med-offwhite px-4 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                                {foodCatalog.length} alimentos — elige uno
                              </p>
                              {foodCatalog.map(food => (
                                <button
                                  key={food.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedFood(food);
                                    setSearchTerm('');
                                  }}
                                  className="w-full flex justify-between items-center gap-4 px-5 py-4 hover:bg-med-olive/10 transition-colors border-b border-slate-100 last:border-0 text-left"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-base text-med-slate">{food.name}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{food.category} · {food.calories} kcal / {Number(food.is_weight_based) === 1 ? '100g' : 'unidad'}</p>
                                  </div>
                                  <ChevronRight size={20} className="text-med-olive shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                          {searchTerm && foodCatalog.length === 0 && (
                            <div className="mt-3 text-center py-5 px-4 bg-med-offwhite rounded-2xl border border-dashed border-med-olive/30 space-y-3">
                              <p className="text-sm text-slate-500">
                                No hay resultados para «<span className="font-bold text-med-slate">{searchTerm}</span>»
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowAddFoodModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-med-olive text-white rounded-xl font-bold hover:bg-med-slate transition-colors shadow-md"
                              >
                                <Plus size={18} />
                                Dar de alta este alimento
                              </button>
                            </div>
                          )}
                          {!searchTerm && (
                            <button
                              type="button"
                              onClick={() => setShowAddFoodModal(true)}
                              className="mt-3 w-full py-3 text-sm font-bold text-med-olive hover:bg-med-olive/10 rounded-xl border border-dashed border-med-olive/30 transition-colors"
                            >
                              + Crear alimento nuevo en la base de datos
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-med-offwhite p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center border border-med-olive/20">
                          <div className="flex-1 text-center sm:text-left">
                            <p className="font-bold text-med-olive">{selectedFood.name}</p>
                            <p className="text-xs text-slate-500">Valores por {Number(selectedFood.is_weight_based) === 1 ? '100g' : 'unidad'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative w-32">
                              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 text-med-olive" size={18} />
                              <input
                                autoFocus
                                type="number"
                                placeholder={Number(selectedFood.is_weight_based) === 1 ? "Gramos" : "Unid."}
                                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-med-olive/20 rounded-xl focus:border-med-olive outline-none transition-all text-sm font-bold"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                              />
                            </div>
                            <button 
                              type="button"
                              disabled={isSaving}
                              onClick={(e) => {
                                e.preventDefault();
                                addFoodToMeal();
                              }} 
                              className="bg-med-olive text-white px-6 py-2 rounded-xl font-bold hover:bg-med-slate transition-all shadow-md disabled:opacity-50"
                            >
                              {isSaving ? 'Guardando…' : 'Añadir'}
                            </button>
                            <button onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-med-terracotta p-2">
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                      <button onClick={resetAddUI} className="w-full text-center text-xs font-bold text-slate-400 hover:text-med-slate">
                        Cancelar búsqueda
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveMeal(meal.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-med-blue-light rounded-xl text-med-blue hover:border-med-olive hover:text-med-olive transition-all font-bold text-sm"
                    >
                      <Plus size={18} /> Registrar alimento
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
