import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, 'db');
mkdirSync(dbDir, { recursive: true });

const foodsPath = join(dbDir, 'foods.json');
const logsPath = join(dbDir, 'logs.json');
const weightsPath = join(dbDir, 'weights.json');

const INITIAL_FOODS = [
  { id: 'chicken_breast', name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'beef_steak', name: 'Ternera (Filete)', calories: 250, protein: 26, carbs: 0, fat: 15, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'pork_loin', name: 'Lomo de Cerdo', calories: 143, protein: 26, carbs: 0, fat: 4.3, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'turkey', name: 'Pavo (Pechuga)', calories: 135, protein: 30, carbs: 0, fat: 1, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'jamon_iberico', name: 'Jamón Ibérico', calories: 375, protein: 30, carbs: 0.5, fat: 28, sugar: 0.2, category: 'Proteínas', is_weight_based: 1 },
  { id: 'salmon', name: 'Salmón', calories: 208, protein: 20, carbs: 0, fat: 13, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'white_fish', name: 'Pescado Blanco (Merluza)', calories: 90, protein: 18, carbs: 0, fat: 2, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'tuna_fresh', name: 'Atún fresco', calories: 130, protein: 28, carbs: 0, fat: 1, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'cod', name: 'Bacalao', calories: 82, protein: 18, carbs: 0, fat: 0.7, sugar: 0, category: 'Proteínas', is_weight_based: 1 },
  { id: 'apple', name: 'Manzana', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, sugar: 10, category: 'Frutas', is_weight_based: 1 },
  { id: 'banana', name: 'Plátano', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, sugar: 12, category: 'Frutas', is_weight_based: 1 },
  { id: 'orange', name: 'Naranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, sugar: 9, category: 'Frutas', is_weight_based: 1 },
  { id: 'tomato', name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, sugar: 2.6, category: 'Verduras', is_weight_based: 1 },
  { id: 'spinach', name: 'Espinacas', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, sugar: 0.4, category: 'Verduras', is_weight_based: 1 },
  { id: 'broccoli', name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, sugar: 1.7, category: 'Verduras', is_weight_based: 1 },
  { id: 'zucchini', name: 'Calabacín', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, sugar: 2.5, category: 'Verduras', is_weight_based: 1 },
  { id: 'lentils', name: 'Lentejas cocidas', calories: 116, protein: 9, carbs: 20, fat: 0.4, sugar: 1.8, category: 'Legumbres', is_weight_based: 1 },
  { id: 'chickpeas', name: 'Garbanzos cocidos', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, sugar: 4.8, category: 'Legumbres', is_weight_based: 1 },
  { id: 'brown_rice', name: 'Arroz Integral cocido', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, sugar: 0.4, category: 'Cereales', is_weight_based: 1 },
  { id: 'pasta_whole', name: 'Pasta Integral cocida', calories: 124, protein: 5.3, carbs: 27, fat: 0.5, sugar: 0.5, category: 'Cereales', is_weight_based: 1 },
  { id: 'potato', name: 'Patata cocida', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, sugar: 0.8, category: 'Tubérculos', is_weight_based: 1 },
  { id: 'egg_l', name: 'Huevo L', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, sugar: 0.6, category: 'Proteínas', is_weight_based: 0 },
  { id: 'whole_slice', name: 'Rebanada Pan Integral', calories: 100, protein: 4, carbs: 18, fat: 1.5, sugar: 1.5, category: 'Cereales', is_weight_based: 0 },
  { id: 'yogurt_unit', name: 'Yogur Griego Natural', calories: 74, protein: 10, carbs: 4, fat: 0.5, sugar: 4, category: 'Lácteos', is_weight_based: 0 },
  { id: 'milk_glass', name: 'Leche Semidesnatada', calories: 94, protein: 6.8, carbs: 9.6, fat: 3, sugar: 9.6, category: 'Lácteos', is_weight_based: 0 },
  { id: 'olive_oil_spoon', name: 'Cucharada Aceite Oliva', calories: 88, protein: 0, carbs: 0, fat: 10, sugar: 0, category: 'Grasas', is_weight_based: 0 },
];

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function mergeWithInitial(stored) {
  if (!stored || stored.length === 0) return [...INITIAL_FOODS];
  const existingIds = new Set(stored.map((f) => f.id));
  const missing = INITIAL_FOODS.filter((f) => !existingIds.has(f.id));
  return missing.length > 0 ? [...stored, ...missing] : stored;
}

function reloadFoods() {
  foods = mergeWithInitial(loadJson(foodsPath, null));
}

let foods = mergeWithInitial(loadJson(foodsPath, null));
saveJson(foodsPath, foods);

let logs = loadJson(logsPath, []);

function nextLogId() {
  if (logs.length === 0) return 1;
  return Math.max(...logs.map((l) => l.id)) + 1;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/foods', (req, res) => {
  reloadFoods();
  const search = (req.query.search || '').toLowerCase();
  const result = search
    ? foods.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.category.toLowerCase().includes(search)
      )
    : foods;
  res.json(result);
});

function slugifyId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'alimento';
}

function buildFoodFields(body) {
  const { name, calories, protein, carbs, fat, sugar, category, is_weight_based } = body;
  if (!name?.trim()) return { error: 'El nombre es obligatorio' };
  return {
    name: name.trim(),
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    sugar: Number(sugar) || 0,
    category: category?.trim() || 'Otros',
    is_weight_based: Number(is_weight_based) === 0 ? 0 : 1,
  };
}

function updateFoodById(id, fields) {
  reloadFoods();
  const index = foods.findIndex((f) => f.id === id);
  if (index === -1) return { error: 'Alimento no encontrado', status: 404 };

  if (foods.some((f, i) => i !== index && f.name.toLowerCase() === fields.name.toLowerCase())) {
    return { error: 'Ya existe un alimento con ese nombre', status: 409 };
  }

  const updated = { ...foods[index], ...fields };
  foods[index] = updated;
  saveJson(foodsPath, foods);
  return { food: updated };
}

app.post('/api/foods', (req, res) => {
  reloadFoods();
  const fields = buildFoodFields(req.body);
  if (fields.error) return res.status(400).json({ error: fields.error });

  // Actualizar si viene id (cuerpo) o si es edición explícita
  const updateId = req.body.id;
  if (updateId) {
    const result = updateFoodById(updateId, fields);
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.json(result.food);
  }

  if (foods.some((f) => f.name.toLowerCase() === fields.name.toLowerCase())) {
    return res.status(409).json({ error: 'Ya existe un alimento con ese nombre' });
  }

  const food = {
    id: `${slugifyId(fields.name)}_${Date.now()}`,
    ...fields,
  };

  foods.push(food);
  saveJson(foodsPath, foods);
  res.status(201).json(food);
});

app.get('/api/foods/:id', (req, res) => {
  reloadFoods();
  const food = foods.find((f) => f.id === req.params.id);
  if (!food) return res.status(404).json({ error: 'Alimento no encontrado' });
  res.json(food);
});

app.put('/api/foods/:id', (req, res) => {
  const fields = buildFoodFields(req.body);
  if (fields.error) return res.status(400).json({ error: fields.error });

  const result = updateFoodById(req.params.id, fields);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.food);
});

app.patch('/api/foods/:id', (req, res) => {
  const fields = buildFoodFields(req.body);
  if (fields.error) return res.status(400).json({ error: fields.error });

  const result = updateFoodById(req.params.id, fields);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.food);
});

app.delete('/api/foods/:id', (req, res) => {
  reloadFoods();
  const index = foods.findIndex((f) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Alimento no encontrado' });

  foods.splice(index, 1);
  saveJson(foodsPath, foods);
  res.json({ success: true });
});

app.get('/api/logs/:date', (req, res) => {
  const { date } = req.params;
  res.json(logs.filter((l) => l.date === date));
});

app.post('/api/logs', (req, res) => {
  const { date, meal_id, food_id, name, amount, calories, protein, carbs, fat, sugar, unit_label } = req.body;

  if (!date || !meal_id || !food_id || !name || amount == null) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const entry = {
    id: nextLogId(),
    date,
    meal_id,
    food_id,
    name,
    amount: Number(amount),
    calories: Number(calories),
    protein: Number(protein),
    carbs: Number(carbs),
    fat: Number(fat),
    sugar: Number(sugar),
    unit_label: unit_label || 'g',
  };

  logs.push(entry);
  saveJson(logsPath, logs);
  res.json({ id: entry.id });
});

app.delete('/api/logs/:id', (req, res) => {
  const id = Number(req.params.id);
  logs = logs.filter((l) => l.id !== id);
  saveJson(logsPath, logs);
  res.json({ success: true });
});

// Weight endpoints
app.get('/api/weight', (req, res) => {
  const weights = loadJson(weightsPath, []);
  res.json(weights.sort((a, b) => String(a.date).localeCompare(String(b.date))));
});

app.post('/api/weight', (req, res) => {
  const { date, weight, notes } = req.body;
  
  if (!date || weight == null) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (date, weight)' });
  }
  
  let weights = loadJson(weightsPath, []);
  
  // Check if date already exists
  const existingIndex = weights.findIndex(w => w.date === date);
  
  const entry = {
    id: existingIndex !== -1 ? weights[existingIndex].id : (weights.length > 0 ? Math.max(...weights.map(w => w.id)) + 1 : 1),
    date,
    weight: Number(weight),
    notes: notes || ''
  };
  
  if (existingIndex !== -1) {
    weights[existingIndex] = entry;
  } else {
    weights.push(entry);
  }
  
  weights.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  saveJson(weightsPath, weights);
  res.json({ success: true, id: entry.id });
});

app.delete('/api/weight/:id', (req, res) => {
  const id = Number(req.params.id);
  let weights = loadJson(weightsPath, []);
  weights = weights.filter(w => w.id !== id);
  saveJson(weightsPath, weights);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  - GET/POST/PUT/PATCH/DELETE /api/foods');
  console.log('  - GET/POST/DELETE /api/logs');
  console.log('  - GET/POST/DELETE /api/weight');
});
