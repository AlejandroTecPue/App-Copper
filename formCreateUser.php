<?php
session_start();

// Verificar que el usuario está logueado y es admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'supervisor') {
    header("Location: dashboard.html");
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Crear Usuario - Cooper Ingeniería</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body class="login-body">
  <div class="login-container">
    <div class="login-logo">
      <img src="img/logo.png" alt="Cooper Ingeniería" />
      <h1>Registrar Nuevo Usuario</h1>
    </div>

    <form id="registro-form" class="login-form" method="POST" action="createUser.php">
      <label for="email">Correo electrónico</label>
      <input type="email" id="email" name="email" required />

      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" required />

      <label for="role">Rol</label>
      <select id="role" name="role" required>
        <option value="operador">Operador</option>
        <option value="ingenierio">Ingeniero</option>
      </select>

      <button type="submit">Registrar Usuario</button>
    </form>
  </div>

  <script>
    // Simulación de sesión: solo el supervisor puede ver este formulario
    const currentUserRole = 'admin'; // Esto debería venir del servidor

    if (currentUserRole !== 'admin') {
      alert('No tienes permisos para crear usuarios.');
      window.location.href = 'dashboard.html'; // Redirigir al dashboard si no es admin
    }
  </script>
</body>
</html>



