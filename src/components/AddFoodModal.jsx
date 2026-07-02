import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Plus, Search, ChevronDown } from 'lucide-react';
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
  recipe_ingredients: [],
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
  recipe_ingredients: Array.isArray(food.recipe_ingredients) ? food.recipe_ingredients : [],
});

const nutrients = ['calories', 'protein', 'carbs', 'fat', 'sugar'];

const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const sortFoodsByName = (foods) => [...foods].sort((a, b) => (
  String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' })
));

const calculateIngredient = (ingredient) => {
  const amount = parseFloat(ingredient.amount) || 0;
  const factor = Number(ingredient.is_weight_based) === 1 ? amount / 100 : amount;
  return nutrients.reduce((acc, key) => {
    acc[key] = round1((Number(ingredient[key]) || 0) * factor);
    return acc;
  }, {});
};

const calculateRecipeTotals = (ingredients) => ingredients.reduce((acc, ingredient) => {
  const totals = calculateIngredient(ingredient);
  nutrients.forEach((key) => {
    acc[key] = round1(acc[key] + totals[key]);
  });
  return acc;
}, { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 });

const calculateRecipeWeight = (ingredients) => ingredients.reduce((total, ingredient) => (
  Number(ingredient.is_weight_based) === 1 ? total + (parseFloat(ingredient.amount) || 0) : total
), 0);

const scaleTotals = (totals, factor) => nutrients.reduce((acc, key) => {
  acc[key] = round1((Number(totals[key]) || 0) * factor);
  return acc;
}, {});

const scaleIngredientForReference = (ingredient, factor) => {
  const scaledIngredient = {
    ...ingredient,
    amount: round1((parseFloat(ingredient.amount) || 0) * factor),
  };

  return {
    ...scaledIngredient,
    totals: calculateIngredient(scaledIngredient),
  };
};

const AddFoodModal = ({ isOpen, onClose, onSaved, onDeleted, foodToEdit, initialName = '' }) => {
  const [form, setForm] = useState(emptyForm);
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [ingredientPickers, setIngredientPickers] = useState({});

  const isEditing = Boolean(foodToEdit);
  const hasIngredients = form.recipe_ingredients.length > 0;
  const ingredientOptions = useMemo(() => {
    return sortFoodsByName(catalog.filter((food) => food.id !== foodToEdit?.id));
  }, [catalog, foodToEdit?.id]);
  const recipeTotals = useMemo(() => calculateRecipeTotals(form.recipe_ingredients), [form.recipe_ingredients]);
  const recipeWeight = useMemo(() => calculateRecipeWeight(form.recipe_ingredients), [form.recipe_ingredients]);
  const recipeReferenceFactor = form.is_weight_based === '1' && recipeWeight > 0 ? 100 / recipeWeight : 1;
  const recipeReferenceTotals = useMemo(
    () => scaleTotals(recipeTotals, recipeReferenceFactor),
    [recipeTotals, recipeReferenceFactor]
  );

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCategoryTouched(false);
    setIngredientPickers({});
    if (foodToEdit) {
      setForm(foodToForm(foodToEdit));
    } else {
      setForm({ ...emptyForm, name: initialName });
    }
  }, [isOpen, initialName, foodToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    persistence.getFoods()
      .then((foods) => setCatalog(Array.isArray(foods) ? foods : []))
      .catch(() => setCatalog([]));
  }, [isOpen]);

  useEffect(() => {
    if (!hasIngredients) return;
    setForm((prev) => ({
      ...prev,
      category: categoryTouched ? prev.category : 'Platos',
      calories: String(recipeReferenceTotals.calories),
      protein: String(recipeReferenceTotals.protein),
      carbs: String(recipeReferenceTotals.carbs),
      fat: String(recipeReferenceTotals.fat),
      sugar: String(recipeReferenceTotals.sugar),
    }));
  }, [categoryTouched, hasIngredients, recipeReferenceTotals]);

  if (!isOpen) return null;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addIngredient = () => {
    const food = ingredientOptions[0];
    if (!food) {
      setError('Primero necesitas tener algún alimento en el catálogo para añadirlo como ingrediente.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      recipe_ingredients: [
        ...prev.recipe_ingredients,
        {
          food_id: food.id,
          name: food.name,
          amount: Number(food.is_weight_based) === 1 ? 100 : 1,
          unit_label: Number(food.is_weight_based) === 1 ? 'g' : 'unid.',
          calories: Number(food.calories) || 0,
          protein: Number(food.protein) || 0,
          carbs: Number(food.carbs) || 0,
          fat: Number(food.fat) || 0,
          sugar: Number(food.sugar) || 0,
          is_weight_based: Number(food.is_weight_based) === 0 ? 0 : 1,
        },
      ],
    }));
  };

  const updateIngredient = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.map((ingredient, i) => {
        if (i !== index) return ingredient;

        if (field === 'food_id') {
          const food = ingredientOptions.find((item) => item.id === value);
          if (!food) return ingredient;
          return {
            food_id: food.id,
            name: food.name,
            amount: Number(food.is_weight_based) === 1 ? 100 : 1,
            unit_label: Number(food.is_weight_based) === 1 ? 'g' : 'unid.',
            calories: Number(food.calories) || 0,
            protein: Number(food.protein) || 0,
            carbs: Number(food.carbs) || 0,
            fat: Number(food.fat) || 0,
            sugar: Number(food.sugar) || 0,
            is_weight_based: Number(food.is_weight_based) === 0 ? 0 : 1,
          };
        }

        return {
          ...ingredient,
          [field]: field === 'amount' ? value : ingredient[field],
        };
      }),
    }));
  };

  const removeIngredient = (index) => {
    setForm((prev) => ({
      ...prev,
      recipe_ingredients: prev.recipe_ingredients.filter((_, i) => i !== index),
    }));
    setIngredientPickers((prev) => Object.fromEntries(
      Object.entries(prev)
        .filter(([key]) => Number(key) !== index)
        .map(([key, value]) => [Number(key) > index ? Number(key) - 1 : key, value])
    ));
  };

  const openIngredientPicker = (index, name = '') => {
    setIngredientPickers((prev) => ({
      ...prev,
      [index]: { open: true, query: name },
    }));
  };

  const updateIngredientPicker = (index, query) => {
    setIngredientPickers((prev) => ({
      ...prev,
      [index]: { open: true, query },
    }));
  };

  const closeIngredientPicker = (index) => {
    setIngredientPickers((prev) => ({
      ...prev,
      [index]: { open: false, query: '' },
    }));
  };

  const selectIngredient = (index, foodId) => {
    updateIngredient(index, 'food_id', foodId);
    closeIngredientPicker(index);
  };

  const payload = () => {
    const referenceIngredients = form.recipe_ingredients.map((ingredient) => (
      scaleIngredientForReference(ingredient, recipeReferenceFactor)
    ));
    const referenceTotals = hasIngredients ? recipeReferenceTotals : {
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      sugar: parseFloat(form.sugar) || 0,
    };

    return {
      name: form.name.trim(),
      category: form.category,
      calories: referenceTotals.calories,
      protein: referenceTotals.protein,
      carbs: referenceTotals.carbs,
      fat: referenceTotals.fat,
      sugar: referenceTotals.sugar,
      is_weight_based: form.is_weight_based === '1' ? 1 : 0,
      recipe_ingredients: referenceIngredients,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (hasIngredients && form.is_weight_based === '1' && recipeWeight <= 0) {
      setError('Para guardar un plato por 100 g, añade al menos un ingrediente medido en gramos.');
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

  const unitLabel = form.is_weight_based === '1' ? '100 g' : 'unidad / ración';

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
              onChange={(e) => {
                setCategoryTouched(true);
                update('category', e.target.value);
              }}
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
            {hasIngredients && (
              <p className="text-xs text-slate-400">Los valores nutricionales se recalculan desde los ingredientes del plato.</p>
            )}
          </fieldset>

          <div className="rounded-2xl border border-med-blue-light bg-med-offwhite/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-med-slate">Ingredientes del plato</h4>
                <p className="text-xs text-slate-500">Opcional: añade alimentos del catálogo para calcular el total.</p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-med-olive border border-med-olive/20 text-xs font-bold hover:bg-med-olive/10"
              >
                <Plus size={14} />
                Añadir
              </button>
            </div>

            {form.recipe_ingredients.length > 0 && (
              <div className="space-y-2">
                {form.recipe_ingredients.map((ingredient, index) => {
                  const totals = calculateIngredient(ingredient);
                  const ingredientUnit = Number(ingredient.is_weight_based) === 1 ? 'g' : 'unid.';
                  const picker = ingredientPickers[index] || { open: false, query: '' };
                  const normalizedFilter = normalizeText(picker.query);
                  const selectedFood = ingredientOptions.find((food) => food.id === ingredient.food_id);
                  const filteredOptions = normalizedFilter
                    ? ingredientOptions.filter((food) => (
                      normalizeText(food.name).includes(normalizedFilter) ||
                      normalizeText(food.category).includes(normalizedFilter)
                    ))
                    : ingredientOptions;
                  return (
                    <div key={`${ingredient.food_id}-${index}`} className="bg-white rounded-xl p-3 border border-slate-100 space-y-2">
                      <div className="min-w-0 space-y-2">
                        <button
                          type="button"
                          onClick={() => openIngredientPicker(index, ingredient.name)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-med-blue/10 bg-med-offwhite px-3 py-2 text-left text-sm font-bold text-med-slate hover:border-med-olive/50 focus:border-med-olive focus:outline-none"
                          aria-expanded={picker.open}
                        >
                          <span className="min-w-0 truncate">
                            {ingredient.name}
                            {selectedFood?.category ? ` · ${selectedFood.category}` : ''}
                          </span>
                          <ChevronDown size={16} className="shrink-0 text-slate-400" />
                        </button>

                        {picker.open && (
                          <div className="rounded-xl border border-med-blue/10 bg-white p-2 shadow-sm">
                            <label className="relative block">
                              <span className="sr-only">Buscar ingrediente</span>
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="search"
                                value={picker.query}
                                onChange={(e) => updateIngredientPicker(index, e.target.value)}
                                placeholder="Buscar ingrediente..."
                                className="w-full pl-8 pr-3 py-2 bg-white border border-med-blue/10 rounded-lg focus:border-med-olive outline-none text-sm"
                                autoFocus
                              />
                            </label>
                            <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50">
                              {filteredOptions.length > 0 ? (
                                filteredOptions.map((food) => (
                                  <button
                                    key={food.id}
                                    type="button"
                                    onClick={() => selectIngredient(index, food.id)}
                                    className={`w-full px-3 py-2 text-left hover:bg-med-offwhite transition-colors ${
                                      food.id === ingredient.food_id ? 'bg-med-offwhite/80' : 'bg-white'
                                    }`}
                                  >
                                    <span className="block text-sm font-bold text-med-slate">{food.name}</span>
                                    <span className="block text-[10px] font-medium text-slate-400">
                                      {food.category || 'Otros'} · {Number(food.calories) || 0} kcal / {Number(food.is_weight_based) === 1 ? '100g' : 'unid.'}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <p className="px-3 py-2 text-xs text-slate-400">No hay ingredientes que coincidan.</p>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-500">
                          {totals.calories.toFixed(1)} kcal · P {totals.protein.toFixed(1)}g · H {totals.carbs.toFixed(1)}g · G {totals.fat.toFixed(1)}g · Az {totals.sugar.toFixed(1)}g
                        </p>
                      </div>

                      <div className="grid grid-cols-[1fr_92px_auto] gap-2 items-start">
                        <div className="min-w-0" />
                        <label className="block">
                          <span className="sr-only">Cantidad</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ingredient.amount}
                            onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                            className="w-full px-2 py-2 bg-med-offwhite border border-med-blue/10 rounded-lg focus:border-med-olive outline-none text-sm font-bold"
                          />
                          <span className="block text-[10px] text-center text-slate-400 mt-0.5">{ingredientUnit}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Calorías (kcal)</span>
              <input type="number" min="0" step="0.1" value={form.calories} onChange={(e) => update('calories', e.target.value)} readOnly={hasIngredients} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none read-only:text-slate-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Proteínas (g)</span>
              <input type="number" min="0" step="0.1" value={form.protein} onChange={(e) => update('protein', e.target.value)} readOnly={hasIngredients} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none read-only:text-slate-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Hidratos (g)</span>
              <input type="number" min="0" step="0.1" value={form.carbs} onChange={(e) => update('carbs', e.target.value)} readOnly={hasIngredients} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none read-only:text-slate-500" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Grasas (g)</span>
              <input type="number" min="0" step="0.1" value={form.fat} onChange={(e) => update('fat', e.target.value)} readOnly={hasIngredients} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none read-only:text-slate-500" />
            </label>
            <label className="block space-y-1.5 col-span-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Azúcares (g)</span>
              <input type="number" min="0" step="0.1" value={form.sugar} onChange={(e) => update('sugar', e.target.value)} readOnly={hasIngredients} className="w-full px-3 py-2.5 bg-med-offwhite border-2 border-med-blue/10 rounded-xl focus:border-med-olive outline-none read-only:text-slate-500" />
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
