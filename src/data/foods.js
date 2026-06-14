export const foodDatabase = [
  // --- FRUTAS (Valores por ración típica) ---
  { id: 'apple', name: 'Manzana', calories: 78, protein: 0.5, carbs: 20, fat: 0.3, sugar: 15, unit: 'pieza (150g)', category: 'Frutas' },
  { id: 'banana', name: 'Plátano', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, sugar: 12, unit: 'pieza (100g)', category: 'Frutas' },
  { id: 'orange', name: 'Naranja', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, sugar: 12, unit: 'pieza (150g)', category: 'Frutas' },
  { id: 'pear', name: 'Pera', calories: 85, protein: 0.6, carbs: 22, fat: 0.2, sugar: 14, unit: 'pieza (150g)', category: 'Frutas' },
  { id: 'kiwi', name: 'Kiwi', calories: 42, protein: 0.8, carbs: 10, fat: 0.4, sugar: 6, unit: 'pieza (70g)', category: 'Frutas' },
  { id: 'strawberries', name: 'Fresas', calories: 33, protein: 0.7, carbs: 8, fat: 0.3, sugar: 4.9, unit: 'taza (100g)', category: 'Frutas' },
  { id: 'grapes', name: 'Uvas', calories: 67, protein: 0.6, carbs: 18, fat: 0.4, sugar: 16, unit: 'racimo pequeño (100g)', category: 'Frutas' },
  { id: 'watermelon', name: 'Sandía', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, sugar: 6, unit: 'tajada (100g)', category: 'Frutas' },
  { id: 'melon', name: 'Melón', calories: 34, protein: 0.8, carbs: 8, fat: 0.2, sugar: 8, unit: 'tajada (100g)', category: 'Frutas' },

  // --- VERDURAS Y HORTALIZAS (Valores por 100g) ---
  { id: 'tomato', name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, sugar: 2.6, unit: 'unidad (100g)', category: 'Verduras' },
  { id: 'spinach', name: 'Espinacas', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, sugar: 0.4, unit: 'taza (100g)', category: 'Verduras' },
  { id: 'broccoli', name: 'Brócoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, sugar: 1.7, unit: 'taza (100g)', category: 'Verduras' },
  { id: 'avocado', name: 'Aguacate', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, sugar: 0.7, unit: 'medio (100g)', category: 'Verduras/Grasas' },
  { id: 'zucchini', name: 'Calabacín', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, sugar: 2.5, unit: 'unidad (200g)', caloriesPerUnit: 34, category: 'Verduras' },
  { id: 'eggplant', name: 'Berenjena', calories: 25, protein: 1, carbs: 6, fat: 0.2, sugar: 3.5, unit: 'unidad (250g)', caloriesPerUnit: 62, category: 'Verduras' },
  { id: 'cucumber', name: 'Pepino', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, sugar: 1.7, unit: 'unidad (200g)', caloriesPerUnit: 30, category: 'Verduras' },
  { id: 'pepper_red', name: 'Pimiento Rojo', calories: 31, protein: 1, carbs: 6, fat: 0.3, sugar: 4.2, unit: 'unidad (150g)', caloriesPerUnit: 46, category: 'Verduras' },
  { id: 'onion', name: 'Cebolla', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, sugar: 4.2, unit: 'unidad (100g)', category: 'Verduras' },
  { id: 'garlic', name: 'Ajo', calories: 149, protein: 6.4, carbs: 33, fat: 0.5, sugar: 1, unit: 'diente (3g)', caloriesPerUnit: 5, category: 'Verduras' },

  // --- CEREALES Y TUBÉRCULOS ---
  { id: 'whole_bread', name: 'Pan Integral', calories: 100, protein: 4, carbs: 18, fat: 1.5, sugar: 1.5, unit: 'rebanada (40g)', category: 'Cereales' },
  { id: 'brown_rice', name: 'Arroz Integral', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, sugar: 0.4, unit: 'taza cocida (100g)', category: 'Cereales' },
  { id: 'oats', name: 'Avena', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, sugar: 0.5, unit: 'taza cocida (100g)', category: 'Cereales' },
  { id: 'quinoa', name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, sugar: 0.9, unit: 'taza cocida (100g)', category: 'Cereales' },
  { id: 'potato', name: 'Patata cocida', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, sugar: 0.8, unit: 'unidad (150g)', caloriesPerUnit: 130, category: 'Tubérculos' },
  { id: 'pasta_whole', name: 'Pasta Integral cocida', calories: 124, protein: 5.3, carbs: 27, fat: 0.5, sugar: 0.5, unit: 'taza (100g)', category: 'Cereales' },

  // --- PROTEÍNAS (Carnes, Pescados, Huevos) ---
  { id: 'egg', name: 'Huevo', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, sugar: 0.6, unit: 'unidad L', category: 'Proteínas' },
  { id: 'chicken_breast', name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'salmon', name: 'Salmón', calories: 208, protein: 20, carbs: 0, fat: 13, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'white_fish', name: 'Merluza / Pescado Blanco', calories: 90, protein: 18, carbs: 0, fat: 2, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'tuna_can', name: 'Atún al natural (Lata)', calories: 60, protein: 14, carbs: 0, fat: 0.5, sugar: 0, unit: 'lata (56g)', category: 'Proteínas' },
  { id: 'beef_steak', name: 'Ternera (Filete)', calories: 250, protein: 26, carbs: 0, fat: 15, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'pork_loin', name: 'Lomo de Cerdo', calories: 143, protein: 26, carbs: 0, fat: 4.3, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'turkey', name: 'Pavo (Pechuga)', calories: 135, protein: 30, carbs: 0, fat: 1, sugar: 0, unit: 'filete (100g)', category: 'Proteínas' },
  { id: 'sardines', name: 'Sardinas en aceite', calories: 208, protein: 25, carbs: 0, fat: 11.5, sugar: 0, unit: 'lata (100g)', category: 'Proteínas' },

  // --- LEGUMBRES ---
  { id: 'lentils', name: 'Lentejas cocidas', calories: 116, protein: 9, carbs: 20, fat: 0.4, sugar: 1.8, unit: 'taza (100g)', category: 'Legumbres' },
  { id: 'chickpeas', name: 'Garbanzos cocidos', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, sugar: 4.8, unit: 'taza (100g)', category: 'Legumbres' },
  { id: 'beans_white', name: 'Alubias Blancas cocidas', calories: 139, protein: 9.7, carbs: 25, fat: 0.4, sugar: 0.3, unit: 'taza (100g)', category: 'Legumbres' },

  // --- LÁCTEOS ---
  { id: 'greek_yogurt', name: 'Yogur Griego Natural', calories: 74, protein: 10, carbs: 4, fat: 0.5, sugar: 4, unit: 'unidad (125g)', category: 'Lácteos' },
  { id: 'milk', name: 'Leche Semidesnatada', calories: 94, protein: 6.8, carbs: 9.6, fat: 3, sugar: 9.6, unit: 'vaso (200ml)', category: 'Lácteos' },
  { id: 'fresh_cheese', name: 'Queso Fresco', calories: 100, protein: 12, carbs: 3, fat: 4, sugar: 3, unit: 'porción (50g)', category: 'Lácteos' },
  { id: 'manchego_cheese', name: 'Queso Manchego', calories: 135, protein: 8, carbs: 0.5, fat: 11, sugar: 0.5, unit: 'cuña pequeña (30g)', category: 'Lácteos' },
  { id: 'kefir', name: 'Kéfir Natural', calories: 60, protein: 3.5, carbs: 4.8, fat: 3, sugar: 4.8, unit: 'taza (100g)', category: 'Lácteos' },

  // --- GRASAS Y FRUTOS SECOS ---
  { id: 'olive_oil', name: 'Aceite de Oliva VE', calories: 88, protein: 0, carbs: 0, fat: 10, sugar: 0, unit: 'cucharada (10ml)', category: 'Grasas' },
  { id: 'walnuts', name: 'Nueces', calories: 196, protein: 4.5, carbs: 4.1, fat: 19.5, sugar: 0.8, unit: 'puñado (30g)', category: 'Grasas' },
  { id: 'almonds', name: 'Almendras', calories: 174, protein: 6, carbs: 6.5, fat: 14, sugar: 1.2, unit: 'puñado (30g)', category: 'Grasas' },
  { id: 'olives', name: 'Aceitunas rellenas', calories: 45, protein: 0.4, carbs: 1, fat: 4.5, sugar: 0.1, unit: '10 unidades (30g)', category: 'Grasas' },
  { id: 'hazelnuts', name: 'Avellanas', calories: 188, protein: 4.5, carbs: 5, fat: 18, sugar: 1.3, unit: 'puñado (30g)', category: 'Grasas' },

  // --- PLATOS TÍPICOS Y OTROS ---
  { id: 'gazpacho', name: 'Gazpacho', calories: 110, protein: 2, carbs: 9, fat: 7, sugar: 6, unit: 'vaso (250ml)', category: 'Platos' },
  { id: 'salmorejo', name: 'Salmorejo', calories: 180, protein: 3, carbs: 15, fat: 12, sugar: 4, unit: 'bol pequeño (150ml)', category: 'Platos' },
  { id: 'tortilla', name: 'Tortilla de Patatas', calories: 150, protein: 5, carbs: 15, fat: 8, sugar: 1, unit: 'ración (100g)', category: 'Platos' },
  { id: 'jamon_iberico', name: 'Jamón Ibérico', calories: 110, protein: 9, carbs: 0.2, fat: 8, sugar: 0.1, unit: 'ración (30g)', category: 'Proteínas' },
];

export const meals = [
  { id: 'breakfast', name: 'Desayuno', icon: 'Sun' },
  { id: 'lunch', name: 'Comida', icon: 'Utensils' },
  { id: 'snack', name: 'Merienda', icon: 'Coffee' },
  { id: 'dinner', name: 'Cena', icon: 'Moon' },
];
