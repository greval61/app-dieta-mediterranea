<?php
// config.php - Configuración de Base de Datos MySQL
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit;
}

// CONFIGURACIÓN DE LA BASE DE DATOS (Rellena estos datos con lo que crees en AwardSpace)
define('DB_HOST', 'fdb1029.awardspace.net'); // Normalmente es localhost o una IP que te da el hosting
define('DB_NAME', '4236817_dieta'); 
define('DB_USER', '4236817_dieta');
define('DB_PASS', 'Carlos@2026');
define('AUTH_SECRET', 'pili_2026'); // Cambia esto por algo aleatorio

function getDB() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = array(
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        );
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Si falla la base de datos, devolvemos un error JSON claro
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(array(
            'error' => 'Error de conexión a la base de datos',
            'details' => $e->getMessage(),
            'help' => 'Verifica los datos en config.php'
        ));
        exit;
    }
}

function slugifyId($name) {
    $name = strtolower(trim($name));
    $name = str_replace(array('á', 'é', 'í', 'ó', 'ú', 'ñ'), array('a', 'e', 'i', 'o', 'u', 'n'), $name);
    $name = preg_replace('/[^a-z0-9]+/', '_', $name);
    return trim($name, '_') ? trim($name, '_') : 'alimento';
}
