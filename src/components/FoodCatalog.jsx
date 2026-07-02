import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Database, Pencil, Trash2, ChevronRight } from 'lucide-react';
import AddFoodModal from './AddFoodModal';
import { persistence } from '../services/persistence';

const FoodCatalog = () => {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const fetchFoods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await persistence.getFoods();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No se pudo cargar el catálogo. Usando datos locales.');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return foods;
    return foods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [foods, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((food) => {
      const cat = food.category || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(food);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filtered]);

  const openCreate = () => {
    setEditingFood(null);
    setModalOpen(true);
  };

  const openEdit = (food) => {
    setEditingFood(food);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFood(null);
  };

  const handleQuickDelete = async (food) => {
    const msg = `¿Eliminar «${food.name}» del catálogo?\n\nLos registros del diario no se borrarán.`;
    if (!window.confirm(msg)) return;

    try {
      await persistence.deleteFood(food.id);
      setFoods((prev) => prev.filter((f) => f.id !== food.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      <AddFoodModal
        isOpen={modalOpen}
        initialName={search}
        foodToEdit={editingFood}
        onClose={closeModal}
        onSaved={(food) => {
          setFoods((prev) => {
            const idx = prev.findIndex((f) => f.id === food.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = food;
              return next;
            }
            return [...prev, food];
          });
        }}
        onDeleted={(id) => setFoods((prev) => prev.filter((f) => f.id !== id))}
      />

      <section className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-med-slate flex items-center gap-2">
            <Database size={28} className="text-med-olive" />
            Catálogo de alimentos
          </h2>
          <p className="text-med-slate/60">
            {foods.length} alimentos en la base de datos — edita o elimina los que necesites.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-med-olive text-white rounded-xl font-bold hover:bg-med-slate transition-colors shadow-md shrink-0"
        >
          <Plus size={18} />
          Nuevo alimento
        </button>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{error}</div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-med-blue-light rounded-2xl focus:border-med-olive outline-none card-shadow text-base"
        />
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-12">Cargando catálogo…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-500 mb-4">
            {search ? `No hay resultados para «${search}»` : 'No hay alimentos en el catálogo'}
          </p>
          <button type="button" onClick={openCreate} className="text-med-olive font-bold hover:underline">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category} className="bg-white rounded-3xl border border-med-blue-light card-shadow overflow-hidden">
              <h3 className="px-6 py-3 bg-med-offwhite/80 font-bold text-med-olive text-sm uppercase tracking-wider border-b border-slate-100">
                {category} ({items.length})
              </h3>
              <ul className="divide-y divide-slate-50">
                {items.map((food) => (
                  <li key={food.id} className="flex items-center gap-4 px-5 py-4 hover:bg-med-offwhite/40 transition-colors group">
                    <button
                      type="button"
                      onClick={() => openEdit(food)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-bold text-med-slate">{food.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {food.calories} kcal · P {food.protein}g · H {food.carbs}g · G {food.fat}g
                        {' · '}
                        {Number(food.is_weight_based) === 1 ? 'por 100g' : 'por unidad'}
                        {Array.isArray(food.recipe_ingredients) && food.recipe_ingredients.length > 0
                          ? ` · ${food.recipe_ingredients.length} ingredientes`
                          : ''}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(food)}
                        className="p-2.5 text-med-olive hover:bg-med-olive/10 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDelete(food)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodCatalog;
