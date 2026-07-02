<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';
$parts = array_filter(explode('/', $path));

$body = file_get_contents('php://input');
$input = json_decode($body, true);
if (!$input) $input = array();

if (empty($parts)) {
    // Test de conexión
    $db = getDB();
    echo json_encode(array('status' => 'API MySQL Running', 'db_connected' => true));
    exit;
}

$resource = $parts[0];

if ($resource === 'foods') {
    handleFoods($method, $parts, $input);
} elseif ($resource === 'logs') {
    handleLogs($method, $parts, $input);
} elseif ($resource === 'weight') {
    handleWeight($method, $parts, $input);
} elseif ($resource === 'login') {
    handleLogin($method, $input);
} else {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(array('error' => 'Not Found'));
}

function handleLogin($method, $input) {
    if ($method !== 'POST') {
        header('HTTP/1.1 405 Method Not Allowed');
        exit;
    }

    $username = isset($input['username']) ? $input['username'] : '';
    $password = isset($input['password']) ? $input['password'] : '';

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute(array($username));
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Generar un token simple
        $token = md5($username . AUTH_SECRET . date('Y-m-d'));
        echo json_encode(array(
            'success' => true,
            'token' => $token,
            'username' => $username
        ));
    } else {
        header('HTTP/1.1 401 Unauthorized');
        echo json_encode(array('error' => 'Usuario o contraseña incorrectos'));
    }
}

function handleFoods($method, $parts, $input) {
    $db = getDB();
    ensureRecipeColumns($db);

    if ($method === 'GET') {
        $search = $_GET['search'] ?? '';
        if ($search) {
            $stmt = $db->prepare("SELECT * FROM foods WHERE name LIKE ? OR category LIKE ?");
            $term = "%$search%";
            $stmt->execute(array($term, $term));
        } else {
            $stmt = $db->query("SELECT * FROM foods");
        }
        $foods = $stmt->fetchAll();
        foreach ($foods as &$food) {
            $food['recipe_ingredients'] = normalizeRecipeIngredients(isset($food['recipe_ingredients']) ? $food['recipe_ingredients'] : null);
        }
        echo json_encode($foods);
    } elseif ($method === 'POST') {
        $id = isset($input['id']) ? $input['id'] : (slugifyId($input['name']) . '_' . time());
        $recipeIngredients = json_encode(normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array()));
        
        $sql = "INSERT INTO foods (id, name, calories, protein, carbs, fat, sugar, category, is_weight_based, recipe_ingredients) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                name=VALUES(name), calories=VALUES(calories), protein=VALUES(protein), 
                carbs=VALUES(carbs), fat=VALUES(fat), sugar=VALUES(sugar), 
                category=VALUES(category), is_weight_based=VALUES(is_weight_based),
                recipe_ingredients=VALUES(recipe_ingredients)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute(array(
            $id, 
            $input['name'], 
            isset($input['calories']) ? $input['calories'] : 0, 
            isset($input['protein']) ? $input['protein'] : 0,
            isset($input['carbs']) ? $input['carbs'] : 0, 
            isset($input['fat']) ? $input['fat'] : 0, 
            isset($input['sugar']) ? $input['sugar'] : 0,
            isset($input['category']) ? $input['category'] : 'Otros', 
            isset($input['is_weight_based']) ? $input['is_weight_based'] : 1,
            $recipeIngredients
        ));
        
        $input['id'] = $id;
        $input['recipe_ingredients'] = normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array());
        echo json_encode($input);
    } elseif ($method === 'DELETE') {
        $id = isset($parts[1]) ? $parts[1] : '';
        $stmt = $db->prepare("DELETE FROM foods WHERE id = ?");
        $stmt->execute(array($id));
        echo json_encode(array('success' => true));
    }
}

function normalizeRecipeIngredients($value) {
    if (is_array($value)) return array_values($value);
    if (!is_string($value) || trim($value) === '') return array();

    $decoded = json_decode($value, true);
    return is_array($decoded) ? array_values($decoded) : array();
}

function ensureRecipeColumns($db) {
    try {
        $db->exec("ALTER TABLE foods ADD COLUMN recipe_ingredients TEXT NULL");
    } catch (PDOException $ignored) {
        // La columna ya existe o el usuario de base de datos no permite ALTER.
    }

    try {
        $db->exec("ALTER TABLE logs ADD COLUMN recipe_ingredients TEXT NULL");
    } catch (PDOException $ignored) {
        // La columna ya existe o el usuario de base de datos no permite ALTER.
    }
}

function handleLogs($method, $parts, $input) {
    $db = getDB();
    ensureRecipeColumns($db);

    if ($method === 'GET') {
        $date = isset($parts[1]) ? $parts[1] : '';
        $stmt = $db->prepare("SELECT * FROM logs WHERE date = ?");
        $stmt->execute(array($date));
        $logs = $stmt->fetchAll();
        foreach ($logs as &$log) {
            $log['recipe_ingredients'] = normalizeRecipeIngredients(isset($log['recipe_ingredients']) ? $log['recipe_ingredients'] : null);
        }
        echo json_encode($logs);
    } elseif ($method === 'POST') {
        $recipeIngredients = json_encode(normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array()));
        $sql = "INSERT INTO logs (date, meal_id, food_id, name, amount, calories, protein, carbs, fat, sugar, unit_label, recipe_ingredients) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($sql);
        $stmt->execute(array(
            $input['date'], 
            $input['meal_id'], 
            $input['food_id'], 
            $input['name'],
            $input['amount'], 
            isset($input['calories']) ? $input['calories'] : 0, 
            isset($input['protein']) ? $input['protein'] : 0,
            isset($input['carbs']) ? $input['carbs'] : 0, 
            isset($input['fat']) ? $input['fat'] : 0, 
            isset($input['sugar']) ? $input['sugar'] : 0,
            isset($input['unit_label']) ? $input['unit_label'] : 'g',
            $recipeIngredients
        ));
        $input['id'] = $db->lastInsertId();
        $input['recipe_ingredients'] = normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array());
        echo json_encode($input);
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        $id = isset($parts[1]) ? $parts[1] : '';
        if ($id === '') {
            header('HTTP/1.1 400 Bad Request');
            echo json_encode(array('error' => 'Falta el id del registro'));
            return;
        }

        $recipeIngredients = json_encode(normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array()));
        $sql = "UPDATE logs
                SET date = ?, meal_id = ?, food_id = ?, name = ?, amount = ?,
                    calories = ?, protein = ?, carbs = ?, fat = ?, sugar = ?,
                    unit_label = ?, recipe_ingredients = ?
                WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute(array(
            $input['date'],
            $input['meal_id'],
            $input['food_id'],
            $input['name'],
            $input['amount'],
            isset($input['calories']) ? $input['calories'] : 0,
            isset($input['protein']) ? $input['protein'] : 0,
            isset($input['carbs']) ? $input['carbs'] : 0,
            isset($input['fat']) ? $input['fat'] : 0,
            isset($input['sugar']) ? $input['sugar'] : 0,
            isset($input['unit_label']) ? $input['unit_label'] : 'g',
            $recipeIngredients,
            $id
        ));

        $input['id'] = $id;
        $input['recipe_ingredients'] = normalizeRecipeIngredients(isset($input['recipe_ingredients']) ? $input['recipe_ingredients'] : array());
        echo json_encode($input);
    } elseif ($method === 'DELETE') {
        $id = isset($parts[1]) ? $parts[1] : '';
        $stmt = $db->prepare("DELETE FROM logs WHERE id = ?");
        $stmt->execute(array($id));
        echo json_encode(array('success' => true));
    }
}

function handleWeight($method, $parts, $input) {
    $db = getDB();

    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM weight_logs ORDER BY date ASC");
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $sql = "INSERT INTO weight_logs (date, weight, notes) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE weight = VALUES(weight), notes = VALUES(notes)";
        $stmt = $db->prepare($sql);
        $stmt->execute(array(
            $input['date'],
            $input['weight'],
            isset($input['notes']) ? $input['notes'] : ''
        ));
        echo json_encode(array('success' => true));
    } elseif ($method === 'DELETE') {
        $id = isset($parts[1]) ? $parts[1] : '';
        $stmt = $db->prepare("DELETE FROM weight_logs WHERE id = ?");
        $stmt->execute(array($id));
        echo json_encode(array('success' => true));
    }
}
