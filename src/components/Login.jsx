import React, { useState } from 'react';
import { Lock, User, Leaf, AlertCircle, Loader2 } from 'lucide-react';
import { persistence } from '../services/persistence';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const auth = await persistence.login(username, password);
      onLogin(auth);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-med-cream p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 sm:p-12 card-shadow space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-med-olive p-4 rounded-3xl shadow-lg shadow-med-olive/20">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-med-slate tracking-tight">Bienvenido</h1>
            <p className="text-slate-400 font-medium">Accede a tu dieta mediterránea</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-med-olive transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-2xl outline-none transition-all font-bold text-med-slate placeholder:text-slate-300"
                placeholder="Usuario"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-med-olive transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-med-offwhite border-2 border-transparent focus:border-med-olive rounded-2xl outline-none transition-all font-bold text-med-slate placeholder:text-slate-300"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-med-olive text-white rounded-2xl font-black text-lg shadow-xl shadow-med-olive/20 hover:bg-med-slate hover:shadow-med-slate/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          App Dieta Mediterránea v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
