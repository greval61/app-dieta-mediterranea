import React, { useRef, useState } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { persistence } from '../services/persistence';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const Backup = () => {
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      setStatus({ type: 'loading', msg: 'Exportando datos...' });
      const dataStr = persistence.exportData();
      const fileName = `dieta_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: dataStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        await Share.share({
          title: fileName,
          url: savedFile.uri,
        });
      } else {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      setStatus({ type: 'success', msg: 'Datos exportados correctamente.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Error al exportar: ' + error.message });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Esto reemplazará TODOS tus datos actuales de este móvil con los del archivo. ¿Estás seguro de continuar?')) {
      e.target.value = '';
      return;
    }

    try {
      setStatus({ type: 'loading', msg: 'Importando datos...' });
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;
        const success = persistence.importData(content);
        if (success) {
          setStatus({ type: 'success', msg: 'Datos importados correctamente. Recargando...' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setStatus({ type: 'error', msg: 'El archivo no es un backup válido o está corrupto.' });
        }
      };
      reader.onerror = () => {
        setStatus({ type: 'error', msg: 'Error al leer el archivo.' });
      };
      reader.readAsText(file);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Error inesperado al importar.' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black text-med-slate mb-2">Copias de Seguridad</h2>
        <p className="text-slate-400 font-medium">Exporta e importa tu base de datos local</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-med-blue-light space-y-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-med-slate">Gestión de Datos</h3>
            <p className="text-sm text-slate-500">Guarda una copia de tus registros o recupéralos al cambiar de móvil.</p>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            status.type === 'error' ? 'bg-red-50 text-red-700' :
            status.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-bold text-sm">{status.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <button
            onClick={handleExport}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-med-offwhite border-2 border-transparent hover:border-med-olive hover:bg-med-olive/5 rounded-3xl transition-all group active:scale-95"
          >
            <div className="bg-med-olive text-white p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-med-olive/30">
              <Download size={24} />
            </div>
            <div className="text-center">
              <span className="block font-black text-med-slate mb-1">Exportar</span>
              <span className="text-xs text-slate-500">Crear copia de seguridad</span>
            </div>
          </button>

          <button
            onClick={handleImportClick}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-med-offwhite border-2 border-transparent hover:border-med-blue hover:bg-med-blue/5 rounded-3xl transition-all group active:scale-95"
          >
            <div className="bg-med-blue text-white p-4 rounded-full group-hover:scale-110 transition-transform shadow-lg shadow-med-blue/30">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <span className="block font-black text-med-slate mb-1">Importar</span>
              <span className="text-xs text-slate-500">Restaurar de otro móvil</span>
            </div>
          </button>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />
        
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mt-6">
          <p className="text-xs text-amber-800 font-medium">
            <strong>Nota importante:</strong> Al importar datos, se reemplazarán por completo todos los registros actuales de esta aplicación.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Backup;
