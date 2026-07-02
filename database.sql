-- Script para inicializar la base de datos MySQL en AwardSpace

-- Tabla de alimentos (Catálogo)
CREATE TABLE IF NOT EXISTS foods (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0,
    sugar FLOAT DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Otros',
    is_weight_based TINYINT(1) DEFAULT 1,
    recipe_ingredients TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE foods ADD COLUMN IF NOT EXISTS recipe_ingredients TEXT NULL;

-- Tabla de registros (Diario)
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    meal_id VARCHAR(50) NOT NULL,
    food_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    amount FLOAT NOT NULL,
    calories FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0,
    sugar FLOAT DEFAULT 0,
    unit_label VARCHAR(20) DEFAULT 'g',
    recipe_ingredients TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de registro de peso
CREATE TABLE IF NOT EXISTS weight_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    weight FLOAT NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE logs ADD COLUMN IF NOT EXISTS recipe_ingredients TEXT NULL;

-- Insertar algunos alimentos iniciales
INSERT IGNORE INTO foods (id, name, calories, protein, carbs, fat, sugar, category, is_weight_based) VALUES
('chicken_breast', 'Pechuga de Pollo', 165, 31, 0, 3.6, 0, 'Proteínas', 1),
('beef_steak', 'Ternera (Filete)', 250, 26, 0, 15, 0, 'Proteínas', 1),
('apple', 'Manzana', 52, 0.3, 14, 0.2, 10, 'Frutas', 1),
('banana', 'Plátano', 89, 1.1, 23, 0.3, 12, 'Frutas', 1),
('egg_l', 'Huevo L', 78, 6.3, 0.6, 5.3, 0.6, 'Proteínas', 0),
('olive_oil_spoon', 'Cucharada Aceite Oliva', 88, 0, 0, 10, 0, 'Grasas', 0);
