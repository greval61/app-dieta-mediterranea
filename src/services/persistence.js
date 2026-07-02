import { foodDatabase } from '../data/foods';

/**
 * Servicio de persistencia híbrido.
 * Intenta usar la API PHP si está disponible, de lo contrario usa LocalStorage.
 */

const STORAGE_KEYS = {
  FOODS: 'dieta_foods',
  LOGS: 'dieta_logs',
  WEEKLY: 'dieta_weekly',
  GOALS: 'dieta_goals',
  AUTH: 'dieta_auth',
  WEIGHTS: 'dieta_weights',
};

const normalizeRecipeIngredients = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const normalizeFood = (food) => ({
  ...food,
  recipe_ingredients: normalizeRecipeIngredients(food.recipe_ingredients),
});

const mergeServerAndLocalFoods = (serverFoods) => {
  const normalizedServer = serverFoods.map(normalizeFood);
  const local = localStorage.getItem(STORAGE_KEYS.FOODS);
  if (!local) return normalizedServer;

  const serverIds = new Set(normalizedServer.map((food) => String(food.id)));
  try {
    const localFoods = JSON.parse(local).map(normalizeFood);
    const localOnly = localFoods.filter((food) => food.id && !serverIds.has(String(food.id)));
    return [...normalizedServer, ...localOnly];
  } catch (e) {
    return normalizedServer;
  }
};

const normalizeLog = (log) => ({
  ...log,
  recipe_ingredients: normalizeRecipeIngredients(log.recipe_ingredients),
});

const isWeightBasedFood = (food) => Number(food?.is_weight_based) === 1;

const getRecipeWeight = (food) => {
  const ingredients = normalizeRecipeIngredients(food?.recipe_ingredients);
  return ingredients.reduce((total, ingredient) => (
    Number(ingredient.is_weight_based) === 1 ? total + (Number(ingredient.amount) || 0) : total
  ), 0);
};

const getFoodFactor = (food, amount) => {
  const parsedAmount = Number(amount) || 0;
  if (!isWeightBasedFood(food)) return parsedAmount;

  const recipeWeight = getRecipeWeight(food);
  const referenceWeight = recipeWeight > 0 ? recipeWeight : 100;
  return parsedAmount / referenceWeight;
};

// Alimentos por defecto si no hay nada en el servidor ni en local
const getDefaultFoods = () => {
  return foodDatabase.map(f => ({
    ...f,
    is_weight_based: f.is_weight_based ?? (f.unit?.includes('100g') || f.unit?.includes('g') ? 1 : 0),
    protein: f.protein || 0,
    carbs: f.carbs || 0,
    fat: f.fat || 0,
    sugar: f.sugar || 0,
    calories: f.calories || 0,
    recipe_ingredients: normalizeRecipeIngredients(f.recipe_ingredients),
  }));
};

const getApiUrl = (endpoint) => {
  // Usamos una ruta absoluta desde la raíz del dominio para la API
  const base = '/api';
  return `${base}${endpoint}`;
};

export const persistence = {
  isOnline: false,

  async checkConnection() {
    try {
      const response = await fetch(getApiUrl('/foods?search='), { cache: 'no-store' });
      this.isOnline = response.ok;
    } catch (e) {
      this.isOnline = false;
    }
    return this.isOnline;
  },

  /**
   * Obtener catálogo de alimentos
   */
  async getFoods(search = '') {
    try {
      const url = getApiUrl(`/foods?search=${encodeURIComponent(search)}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          this.isOnline = true;
          const normalized = mergeServerAndLocalFoods(data);
          if (!search) localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (e) {
      this.isOnline = false;
    }

    const local = localStorage.getItem(STORAGE_KEYS.FOODS);
    let foods = (local ? JSON.parse(local) : getDefaultFoods()).map(normalizeFood);
    
    if (search) {
      const q = search.toLowerCase();
      foods = foods.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.category.toLowerCase().includes(q)
      );
    }
    return foods;
  },

  /**
   * Guardar o actualizar un alimento
   */
  async saveFood(food) {
    try {
      const url = getApiUrl('/foods');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
      });
      if (response.ok) {
        const saved = await response.json();
        this.isOnline = true;
        await this.getFoods(); 
        return normalizeFood(saved);
      }
    } catch (e) {
      this.isOnline = false;
    }

    const local = localStorage.getItem(STORAGE_KEYS.FOODS);
    const foods = (local ? JSON.parse(local) : getDefaultFoods()).map(normalizeFood);
    
    let updatedFood;
    if (food.id) {
      const idx = foods.findIndex(f => f.id === food.id);
      if (idx !== -1) {
        foods[idx] = { ...foods[idx], ...food };
        updatedFood = foods[idx];
      }
    }
    
    if (!updatedFood) {
      updatedFood = { 
        ...food, 
        id: food.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` 
      };
      foods.push(updatedFood);
    }
    
    localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(foods));
    return updatedFood;
  },

  async deleteFood(id) {
    try {
      const url = getApiUrl(`/foods/${id}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        await response.json();
        this.isOnline = true;
        await this.getFoods();
        return true;
      }
    } catch (e) {
      this.isOnline = false;
    }

    const local = localStorage.getItem(STORAGE_KEYS.FOODS);
    if (local) {
      const foods = JSON.parse(local).filter(f => f.id !== id);
      localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(foods));
    }
    return true;
  },

  async getLogs(date) {
    try {
      const url = getApiUrl(`/logs/${date}`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          this.isOnline = true;
          const normalized = data.map(normalizeLog);
          this.updateLocalLogsForDate(date, normalized);
          return normalized;
        }
      }
    } catch (e) {
      this.isOnline = false;
    }

    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    return allLogs.filter(l => l.date === date).map(normalizeLog);
  },

  async saveLog(log) {
    try {
      const url = getApiUrl('/logs');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (response.ok) {
        const result = await response.json();
        this.isOnline = true;
        await this.getLogs(log.date);
        return result;
      }
    } catch (e) {
      this.isOnline = false;
    }

    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    const newLog = { 
      ...log, 
      id: log.id || Date.now() + Math.floor(Math.random() * 1000) 
    };
    allLogs.push(newLog);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
    return newLog;
  },

  async deleteLog(id, date) {
    try {
      const url = getApiUrl(`/logs/${id}`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        await response.json();
        this.isOnline = true;
        if (date) await this.getLogs(date);
        return true;
      }
    } catch (e) {
      this.isOnline = false;
    }

    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    const filtered = allLogs.filter(l => l.id != id);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(filtered));
    return true;
  },

  async updateLog(id, newAmount, currentLog = null) {
    try {
      const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
      const logIndex = allLogs.findIndex(l => l.id == id);
      const oldLog = logIndex >= 0 ? allLogs[logIndex] : currentLog;
      
      if (!oldLog) {
        console.error('Log not found for update:', id);
        return false;
      }

      const foodCatalog = await this.getFoods();
      const food = foodCatalog.find(f => f.id === oldLog.food_id);
      
      if (!food) {
        console.error('Food not found in catalog:', oldLog.food_id);
        return false;
      }
      
      const oldAmount = Number(oldLog.amount) || 0;
      const newAmountNum = Number(newAmount) || 0;
      
      if (newAmountNum <= 0) {
        console.error('Invalid new amount:', newAmount);
        return false;
      }
      
      // Calcular factor de cambio proporcional basado en la cantidad actual
      let factor;
      const currentIngredients = normalizeRecipeIngredients(oldLog.recipe_ingredients);
      
      if (currentIngredients.length > 0 && oldAmount > 0) {
        // Para platos con ingredientes, usar el factor de cambio entre cantidad vieja y nueva
        factor = newAmountNum / oldAmount;
      } else if (isWeightBasedFood(food)) {
        // Para alimentos basados en peso simples, usar la lógica de getFoodFactor
        factor = getFoodFactor(food, newAmountNum);
      } else {
        // Para alimentos por unidades, el factor es simplemente la nueva cantidad
        factor = newAmountNum;
      }
      
      const updatedLog = {
        ...oldLog,
        amount: newAmountNum,
        calories: food.calories * factor,
        protein: food.protein * factor,
        carbs: food.carbs * factor,
        fat: food.fat * factor,
        sugar: food.sugar * factor,
        recipe_ingredients: currentIngredients.map((ingredient) => ({
          ...ingredient,
          amount: (Number(ingredient.amount) || 0) * factor,
          totals: ingredient.totals ? {
            calories: (Number(ingredient.totals.calories) || 0) * factor,
            protein: (Number(ingredient.totals.protein) || 0) * factor,
            carbs: (Number(ingredient.totals.carbs) || 0) * factor,
            fat: (Number(ingredient.totals.fat) || 0) * factor,
            sugar: (Number(ingredient.totals.sugar) || 0) * factor,
          } : undefined,
        })),
      };

      // Primero guardar en localStorage (siempre funciona en APK)
      if (logIndex >= 0) {
        allLogs[logIndex] = updatedLog;
      } else {
        allLogs.push(updatedLog);
      }
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
      
      console.log('Log updated in localStorage:', updatedLog);
      
      // Intentar sincronizar con servidor si está disponible
      try {
        const response = await fetch(getApiUrl(`/logs/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLog),
        });

        if (response.ok) {
          this.isOnline = true;
          if (updatedLog.date) await this.getLogs(updatedLog.date);
          return normalizeLog(updatedLog);
        }
      } catch (e) {
        console.log('Server sync failed, using localStorage only');
        this.isOnline = false;
      }
      
      return updatedLog;
    } catch (e) {
      console.error('Error updating log:', e);
      return false;
    }
  },

  updateLocalLogsForDate(date, serverLogs) {
    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    const otherDates = allLogs.filter(l => l.date !== date);
    const updated = [...otherDates, ...serverLogs];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
  },

  getWeeklyData() {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY);
    return data ? JSON.parse(data) : {
      legumbres: 0, pescado: 0, carnesBlancas: 0, huevos: 0, frutosSecos: 0, carnesRojas: 0,
    };
  },

  saveWeeklyData(data) {
    localStorage.setItem(STORAGE_KEYS.WEEKLY, JSON.stringify(data));
  },

  getGoals() {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : {
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
        objective: 'maintain',
        customMacros: {
          calories: '',
          carbs: '',
          protein: '',
          fat: '',
        }
      }
    };
  },

  saveGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  async login(username, password) {
    try {
      const response = await fetch(getApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const contentType = response.headers.get("content-type");
      if (response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data));
          return data;
        } else {
          throw new Error('El servidor no devolvió una respuesta válida (JSON)');
        }
      }
      
      if (contentType && contentType.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error || err.message || 'Error al iniciar sesión');
      } else {
        const text = await response.text();
        if (text.includes("Error de conexión a la base de datos")) {
          throw new Error('Error de conexión a la base de datos en el servidor. Verifica config.php');
        }
        throw new Error(`Error del servidor (${response.status}). Posible problema de configuración.`);
      }
    } catch (e) {
      console.error('Login error:', e);
      // Si la conexión falla (offline, local o ejecutando en APK de Capacitor)
      // permitimos login en modo local offline con cualquier credencial
      const localAuth = {
        username: username || 'usuario_local',
        token: 'offline_token_local',
        isLocal: true
      };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(localAuth));
      this.isOnline = false;
      return localAuth;
    }
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    window.location.reload();
  },

  getAuth() {
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
    return auth ? JSON.parse(auth) : null;
  },

  isAuthenticated() {
    return !!this.getAuth();
  },

  async getWeights() {
    try {
      const response = await fetch(getApiUrl('/weight'));
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          this.isOnline = true;
          return data.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        }
      }
    } catch (e) {
      this.isOnline = false;
    }
    const local = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
    const weights = local ? JSON.parse(local) : [];
    return weights.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  },

  async saveWeight(weightData) {
    try {
      const response = await fetch(getApiUrl('/weight'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weightData)
      });
      if (response.ok) {
        await response.json();
        return true;
      }
    } catch (e) {
      this.isOnline = false;
    }

    const allWeights = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEIGHTS) || '[]');
    const newWeight = {
      ...weightData,
      id: weightData.id || Date.now() + Math.floor(Math.random() * 1000)
    };
    allWeights.push(newWeight);
    allWeights.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(allWeights));
    return true;
  },

  async deleteWeight(id) {
    try {
      const response = await fetch(getApiUrl(`/weight/${id}`), {
        method: 'DELETE'
      });
      if (response.ok) {
        await response.json();
        return true;
      }
    } catch (e) {}

    const allWeights = JSON.parse(localStorage.getItem(STORAGE_KEYS.WEIGHTS) || '[]');
    const filtered = allWeights.filter(w => w.id != id);
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(filtered));
    return true;
  },

  exportData() {
    const data = {};
    for (const key of Object.values(STORAGE_KEYS)) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          data[key] = JSON.parse(val);
        } catch (e) {
          data[key] = val;
        }
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      let importedCount = 0;
      for (const key of Object.values(STORAGE_KEYS)) {
        if (data[key] !== undefined) {
          const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
          localStorage.setItem(key, val);
          importedCount++;
        }
      }
      return importedCount > 0;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }
};
