<?php
session_start();
require_once 'config/db.php';

// Solo permitir si es admin o profesor
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['supervisor', 'ingenierio'])) {
    header("Location: login.html");
    exit;
}

// Obtener usuarios disponibles (por ejemplo, solo alumnos)
$stmt = $pdo->query("SELECT id, email FROM user WHERE role = 'operador'");
$alumnos = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Asignar Trabajo</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="login-body">
  <div class="login-container">
    <div class="login-logo">
      <img src="img/logo.png" alt="Cooper Ingeniería" />
      <h1>Asignar Trabajo</h1>
    </div>

    <form class="login-form" method="POST" action="guardar_trabajo.php" enctype="multipart/form-data">
      <label for="title">Título</label>
      <input type="text" name="title" id="title" required>

      <label for="description">Descripción</label>
      <textarea name="description" id="description" rows="4"></textarea>

      <label for="importance">Importancia (1 a 5)</label>
      <input type="number" name="importance" id="importance" min="1" max="5" required>

      <label for="dueDate">Fecha límite</label>
      <input type="datetime-local" name="dueDate" id="dueDate" required>

      <label for="PDFpath">Archivo PDF</label>
      <input type="file" name="PDFpath" id="PDFpath" accept=".pdf">

      <label for="user_id">Asignar a</label>
      <select name="user_id" id="user_id" required>
        <?php foreach ($alumnos as $alumno): ?>
          <option value="<?= $alumno['id'] ?>"><?= $alumno['email'] ?></option>
        <?php endforeach; ?>
      </select>

      <button type="submit">Asignar Trabajo</button>
    </form>
  </div>
</body>
</html>
