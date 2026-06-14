import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';
import { persistence } from '../services/persistence';

export const FOOD_CATEGORIES = [
  'Proteínas', 'Frutas', 'Verduras', 'Legumbres', 'Cereales',
  'Tubérculos', 'Lácteos', 'Grasas', 'Platos', 'Otros',
];

const emptyForm = {
  name: '',
  category: 'Otros',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  sugar: '',
  is_weight_based: '1',
};

const foodToForm = (food) => ({
  name: food.name,
  category: food.category || 'Otros',
  calories: String(food.calories ?? ''),
  protein: String(food.protein ?? ''),
  carbs: String(food.carbs ?? ''),
  fat: String(food.fat ?? ''),
  sugar: String(food.sugar ?? ''),
  is_weight_based: Number(food.is_weight_based) === 0 ? '0' : '1',
});

const AddFoodModal = ({ isOpen, onClose, onSaved, onDeleted, foodToEdit, initialName = '' }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(foodToEdit);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (foodToEdit) {
      setForm(foodToForm(foodToEdit));
    } else {
      setForm({ ...emptyForm, name: initialName });
    }
  }, [isOpen, initialName, foodToEdit]);

  if (!isOpen) return null;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const payload = () => ({
    name: form.name.trim(),
    category: form.category,
    calories: parseFloat(form.calories) || 0,
    protein: parseFloat(form.protein) || 0,
    carbs: parseFloat(form.carbs) || 0,
    fat: parseFloat(form.fat) || 0,
    sugar: parseFloat(form.sugar) || 0,
    is_weight_based: form.is_weight_based === '1' ? 1 : 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await persistence.saveFood(isEditing ? { id: foodToEdit.id, ...payload() } : payload());
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const msg = `¿Eliminar «${foodToEdit.name}» del catálogo?\n\nLos registros del diario no se borrarán.`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    setError(null);
    try {
      await persistence.deleteFood(foodToEdit.id);
      onDeleted?.(foodToEdit.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const unitLabel = form.is_weight_based === '1' ? '100 g' : 'unidad';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-med-slate/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-med-blue-light">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-3xl">
          <div>
            <h3 className="text-xl font-bold text-med-slate">
              {isEditing ? 'Editar alimento' : 'Nuevo alimento'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Valores nutricionales por {unitLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-med-slate rounded-xl hover:bg-slate-100">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-med-slate">Nombre *</span>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ej. Avena, Queso fresco..."
              className="w-full px-4 py-3 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-med-slate">Categoría</span>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-4 py-3 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none"
            >
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-med-slate">Medida de referencia</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_weight_based"
                  value="1"
                  checked={form.is_weight_based === '1'}
                  onChange={(e) => update('is_weight_based', e.target.value)}
                  className="accent-med-olive"
                />
                <span className="text-sm">Por 100 g</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_weight_based"
                  value="0"
                  checked={form.is_weight_based === '0'}
                  onChange={(e) => update('is_weight_based', e.target.value)}
                  className="accent-med-olive"
                />
                <span className="text-sm">Por unidad / ración</span>
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Calorías (kcal)</span>
              <input type="number" min="0" step="0.1" value={form.calories} onChange={(e) => update('calories', e.target.value)} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Proteínas (g)</span>
              <input type="number" min="0" step="0.1" value={form.protein} onChange={(e) => update('protein', e.target.value)} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Hidratos (g)</span>
              <input type="number" min="0" step="0.1" value={form.carbs} onChange={(e) => update('carbs', e.target.value)} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Grasas (g)</span>
              <input type="number" min="0" step="0.1" value={form.fat} onChange={(e) => update('fat', e.target.value)} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none" />
            </label>
            <label className="block space-y-1.5 col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Azúcares (g)</span>
              <input type="number" min="0" step="0.1" value={form.sugar} onChange={(e) => update('sugar', e.target.value)} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none" />
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving || deleting} className="flex-1 py-3 rounded-xl font-bold bg-med-olive text-white hover:bg-med-slate transition-colors disabled:opacity-50">
                {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar alimento'}
              </button>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="w-full py-3 rounded-xl font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {deleting ? 'Eliminando…' : 'Eliminar del catálogo'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodModal;
