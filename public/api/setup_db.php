<?php
require_once 'config.php';
$db = getDB();

// 1. Crear tablas si no existen
$sql = "
CREATE TABLE IF NOT EXISTS foods (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories FLOAT DEFAULT 0, protein FLOAT DEFAULT 0,
    carbs FLOAT DEFAULT 0, fat FLOAT DEFAULT 0,
    sugar FLOAT DEFAULT 0, category VARCHAR(100) DEFAULT 'Otros',
    is_weight_based TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL, meal_id VARCHAR(50) NOT NULL,
    food_id VARCHAR(100), name VARCHAR(255) NOT NULL,
    amount FLOAT NOT NULL, calories FLOAT DEFAULT 0,
    protein FLOAT DEFAULT 0, carbs FLOAT DEFAULT 0,
    fat FLOAT DEFAULT 0, sugar FLOAT DEFAULT 0,
    unit_label VARCHAR(20) DEFAULT 'g'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS weight_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    weight FLOAT NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $db->exec($sql);
    echo "<h1>Estructura de Base de Datos lista</h1>";
} catch (PDOException $e) {
    die("Error creando tablas: " . $e->getMessage());
}

// 2. Crear usuario si se envían datos
if (isset($_POST['create_user'])) {
    $user = $_POST['username'];
    $pass = password_hash($_POST['password'], PASSWORD_DEFAULT);
    
    try {
        $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)");
        $stmt->execute(array($user, $pass));
        echo "<div style='color: green; font-weight: bold;'>¡Usuario '$user' creado/actualizado correctamente!</div>";
    } catch (PDOException $e) {
        echo "<div style='color: red;'>Error al crear usuario: " . $e->getMessage() . "</div>";
    }
}
?>

<div style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 10px; max-width: 400px;">
    <h2>Crear/Cambiar Usuario de Acceso</h2>
    <form method="POST">
        <div style="margin-bottom: 10px;">
            <label>Usuario:</label><br>
            <input type="text" name="username" required style="width: 100%; padding: 8px;">
        </div>
        <div style="margin-bottom: 10px;">
            <label>Contraseña:</label><br>
            <input type="password" name="password" required style="width: 100%; padding: 8px;">
        </div>
        <button type="submit" name="create_user" style="background: #8B9467; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            Guardar Usuario
        </button>
    </form>
</div>

<p style="margin-top: 20px; color: #666;">
    <em>Nota: Una vez creado el usuario, borra este archivo (setup_db.php) de tu hosting por seguridad.</em>
</p>
