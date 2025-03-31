<?php
session_start();
require_once 'config/db.php'; // tu conexión PDO aquí

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        die('Correo y contraseña son obligatorios.');
    }

    // Buscar al usuario
    $stmt = $pdo->prepare("SELECT * FROM user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && $password === $user['password']){

        // Guardar sesión
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];

        // Redirigir al dashboard según su rol
        switch ($user['role']) {
            case 'supervisor':
                header('Location: dashboard-jefe.html');
                break;
            case 'ingeniero':
                header('Location: dashboard-ingeniero.html');
                break;
            case 'operador':
                header('Location: dashboard.html');
                break;
            default:
                echo "Rol no reconocido.";
        }
        exit;
    } else {
        echo "Correo o contraseña incorrectos.";
    }
}
?>
