<?php
session_start();
require_once 'config/db.php';

// Solo permitir si quien hace la petición es el admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    die("No tienes permiso para realizar esta acción.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? '';

    // Validación básica
    if (empty($email) || empty($password) || empty($role)) {
        die('Todos los campos son obligatorios.');
    }

    // Evitar duplicado del supervisor
    if ($role === 'admin') {
        // Verificamos si ya hay un admin
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM user WHERE role = 'admin'");
        $stmt->execute();
        $adminCount = $stmt->fetchColumn();

        if ($adminCount >= 1) {
            die("Ya existe un supervisor registrado. No se puede crear otro.");
        }
    }

    // Encriptar contraseña
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare("INSERT INTO user (email, password, role) VALUES (?, ?, ?)");
        $stmt->execute([$email, $hashedPassword, $role]);
        echo "Usuario creado correctamente.";
    } catch (PDOException $e) {
        echo "Error al crear el usuario: " . $e->getMessage();
    }
}
?>
