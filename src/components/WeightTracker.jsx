import React, { useState, useEffect } from 'react';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus, Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { persistence } from '../services/persistence';

const WeightTracker = () => {
  const [weights, setWeights] = useState([]);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeights();
  }, []);

  const fetchWeights = async () => {
    setLoading(true);
    const data = await persistence.getWeights();
    setWeights(data);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newWeight || !newDate) return;

    const success = await persistence.saveWeight({
      date: newDate,
      weight: parseFloat(newWeight)
    });

    if (success) {
      setNewWeight('');
      fetchWeights();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro de peso?')) return;
    const success = await persistence.deleteWeight(id);
    if (success) fetchWeights();
  };

  const getStats = () => {
    if (weights.length < 2) return null;
    const first = weights[0].weight;
    const last = weights[weights.length - 1].weight;
    const diff = last - first;
    return {
      diff: diff.toFixed(1),
      isDown: diff < 0,
      isUp: diff > 0
    };
  };

  const stats = getStats();

  // Formatear datos para la gráfica
  const chartData = weights.map(w => ({
    ...w,
    formattedDate: new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-med-slate">Mi Progreso</h2>
          <p className="text-slate-400 font-medium">Sigue la evolución de tu peso</p>
        </div>
        
        {stats && (
          <div className={`px-6 py-4 rounded-3xl flex items-center gap-3 shadow-lg ${
            stats.isDown ? 'bg-green-50 text-green-700' : 
            stats.isUp ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
          }`}>
            <div className={`p-2 rounded-xl ${stats.isDown ? 'bg-green-100' : stats.isUp ? 'bg-red-100' : 'bg-slate-100'}`}>
              {stats.isDown ? <TrendingDown /> : stats.isUp ? <TrendingUp /> : <Minus />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase block opacity-60">Cambio Total</span>
              <span className="text-xl font-black">{stats.diff > 0 ? `+${stats.diff}` : stats.diff} kg</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de registro */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] card-shadow border border-med-blue-light space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-med-olive/10 p-2 rounded-xl text-med-olive">
                <Scale size={20} />
              </div>
              <h3 className="text-lg font-black text-med-slate uppercase tracking-tight">Nuevo Registro</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="00.0"
                  className="w-full p-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-2xl outline-none transition-all font-black text-xl text-med-slate"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Fecha</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-2xl outline-none transition-all font-bold text-med-slate"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-med-olive text-white rounded-2xl font-black text-lg shadow-xl shadow-med-olive/20 hover:bg-med-slate transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus size={24} /> Guardar Peso
            </button>
          </form>

          {/* Lista de últimos registros */}
          <div className="bg-white rounded-[2.5rem] card-shadow border border-med-blue-light overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Historial Reciente</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
              {weights.length === 0 ? (
                <div className="p-8 text-center text-slate-300 font-bold italic">No hay registros aún</div>
              ) : (
                weights.slice().reverse().map((w) => (
                  <div key={w.id} className="flex justify-between items-center p-4 hover:bg-med-offwhite transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                        <CalendarIcon size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-black text-med-slate">{w.weight} kg</span>
                        <span className="text-[10px] font-bold text-slate-400 block">{w.date}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(w.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Gráfica */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-med-blue-light h-full min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                <TrendingDown size={20} />
              </div>
              <h3 className="text-lg font-black text-med-slate uppercase tracking-tight">Gráfica de Evolución</h3>
            </div>

            <div className="flex-1 w-full min-h-[280px] min-w-0">
              {weights.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <div className="bg-slate-50 p-6 rounded-full">
                    <Scale size={48} />
                  </div>
                  <p className="font-bold text-center px-8">Registra al menos dos días para ver tu evolución gráfica</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="formattedDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      hide 
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
                      labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#8B9467" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#8B9467', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      name="Peso (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;
