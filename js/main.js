// ==============================
// INICIALIZACIÓN DEL DOCUMENTO
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  mostrarFechaHoy();
  configurarTabs();
  configurarSidebar();
  configurarCronometros();
  configurarModales();
});

// ==============================
// FUNCIÓN: Mostrar la fecha actual en el dashboard
// ==============================
function mostrarFechaHoy() {
  const todayDateElem = document.getElementById('todayDate');
  if (todayDateElem) {
      const today = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
      todayDateElem.textContent = today;
  }
}

// ==============================
// FUNCIÓN: Configurar Tabs en OT-Detail
// ==============================
function configurarTabs() {
  const tabButtons = document.querySelectorAll('.ot-tabs button');
  tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          // Quitar clase active de todos los botones
          tabButtons.forEach(b => b.classList.remove('active'));
          // Activar el botón clickeado
          btn.classList.add('active');
          // Aquí puedes agregar lógica para mostrar/ocultar contenido
      });
  });
}

// ==============================
// FUNCIÓN: Cargar la Sidebar y asignar eventos
// ==============================
function configurarSidebar() {
  fetch('sidebar.html')
      .then(response => response.text())
      .then(data => {
          document.getElementById('sidebar-container').innerHTML = data;
          
          const hamburgerBtn = document.getElementById('hamburger-btn');
          const sidebarContainer = document.getElementById('sidebar-container');
          const mainContent = document.querySelector('.main-content');

          // Toggle de la sidebar
          hamburgerBtn.addEventListener('click', () => {
              sidebarContainer.classList.toggle('active');
              mainContent.classList.toggle('push');
          });

          // Cerrar la sidebar al hacer clic en algún enlace
          const sidebarLinks = sidebarContainer.querySelectorAll('a');
          sidebarLinks.forEach(link => {
              link.addEventListener('click', () => {
                  sidebarContainer.classList.remove('active');
                  mainContent.classList.remove('push');
              });
          });
      })
      .catch(error => console.error('Error al cargar la sidebar:', error));
}

// ==============================
// FUNCIÓN: Configurar Cronómetros en los Drawing Items
// ==============================
function configurarCronometros() {
  document.querySelectorAll(".drawing-item").forEach(item => {
      const timerDisplay = item.querySelector(".timer-display");
      const btnStart = item.querySelector(".btn-start");
      const btnPause = item.querySelector(".btn-pause");
      const btnStop = item.querySelector(".btn-stop");

      let timerInterval;
      let elapsedTime = 0;
      let running = false;

      function updateDisplay() {
          const hours = Math.floor(elapsedTime / 3600);
          const minutes = Math.floor((elapsedTime % 3600) / 60);
          const seconds = elapsedTime % 60;
          timerDisplay.textContent = 
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      function startTimer() {
          if (!running) {
              running = true;
              timerInterval = setInterval(() => {
                  elapsedTime++;
                  updateDisplay();
              }, 1000);
          }
      }

      function pauseTimer() {
          if (running) {
              running = false;
              clearInterval(timerInterval);
          }
      }

      function stopTimer() {
          running = false;
          clearInterval(timerInterval);
          elapsedTime = 0;
          updateDisplay();
      }

      btnStart.addEventListener("click", startTimer);
      btnPause.addEventListener("click", pauseTimer);
      btnStop.addEventListener("click", stopTimer);
  });
}

// ==============================
// CONFIGURACIÓN DE AUTENTICACIÓN CON MSAL (MICROSOFT AZURE)
// ==============================
/***********************************************
 * Configuración de MSAL para OneDrive
 ***********************************************/
/***********************************************
 * Configuración de MSAL para OneDrive
 ***********************************************/
const msalConfig = {
  auth: {
    clientId: "684bc460-d5d5-4232-b507-fb09e4e28d5f",
    authority: "https://login.microsoftonline.com/a479e588-4385-44a4-9f31-ca5e43bfb143",
    redirectUri: "https://10.50.113.116:8080"
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

async function login() {
  const loginRequest = {
    scopes: ["Files.Read.All", "User.Read", "Files.ReadWrite.All"]
  };

  try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
    console.log("Login Response:", loginResponse);
    msalInstance.setActiveAccount(loginResponse.account);
    return loginResponse.account;
  } catch (error) {
    console.error("Error durante el login:", error);
    alert("Error durante el login: " + error.message);
  }
}

async function getShareLink(itemId, token) {
  // Solicita un link de vista anónimo (sin forzar descarga)
  const body = {
    type: "view",
    scope: "organization"
  };
  const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/createLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el link para vista previa.");
  }

  const data = await response.json();
  // Devuelve la URL que abre la vista previa de OneDrive
  return data.link.webUrl;
}



// Función para listar las OT's asignadas (recorriendo subcarpetas dentro de "OTsAsignadas")
async function listarOTsAsignadas() {
  try {
    // 1. Obtener el token
    const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ["Files.Read.All"] });
    const accessToken = tokenResponse.accessToken;

    // 2. Obtener la carpeta "OTsAsignadas" desde la raíz
    const rootResponse = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/children", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const rootData = await rootResponse.json();
    const otsAsignadasFolder = rootData.value.find(item => item.name === "OTsAsignadas" && item.folder);
    if (!otsAsignadasFolder) {
      alert("No se encontró la carpeta 'OTsAsignadas' en tu OneDrive.");
      return;
    }

    // 3. Listar las subcarpetas dentro de "OTsAsignadas" (cada una corresponde a una OT)
    const subfoldersResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${otsAsignadasFolder.id}/children`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const subfoldersData = await subfoldersResponse.json();
    const otFolders = subfoldersData.value.filter(item => item.folder);

    let tableRows = "";

    // 4. Recorrer cada subcarpeta (cada OT)
    for (const otFolder of otFolders) {
      // Obtener los archivos dentro de esta subcarpeta
      const childrenResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${otFolder.id}/children`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const childrenData = await childrenResponse.json();

      // Buscar el archivo .txt en la subcarpeta
      const txtFile = childrenData.value.find(item => item.name.toLowerCase().endsWith(".txt"));
      let dataObj = {};

      if (txtFile) {
        const contentResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${txtFile.id}/content`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (contentResponse.ok) {
          const textContent = await contentResponse.text();
          // Se asume un formato "Clave: Valor" por línea
          const lines = textContent.split('\n');
          for (const line of lines) {
            const parts = line.split(':');
            if (parts.length >= 2) {
              const key = parts[0].trim().toLowerCase();
              const value = parts.slice(1).join(':').trim();
              dataObj[key] = value;
            }
          }
        }
      }

      // Contar el número de archivos PDF en la carpeta (como cantidad de dibujos)
      const pdfFiles = childrenData.value.filter(item => item.name.toLowerCase().endsWith(".pdf"));
      const dibujosCount = pdfFiles.length;

      // Extraer datos (se usan valores por defecto si no están en el txt)
      const ot = dataObj["ot"] || otFolder.name;
      const status = dataObj["status"] || "Pending";
      const cliente = dataObj["cliente"] || "N/A";
      const piezas = dataObj["piezas completadas"] || "0";
      const fechaEntrega = dataObj["fecha de entrega"] || "";
      const relevancia = dataObj["relevancia"] || "N/A";

      // Generar la fila: el nombre de la OT es un enlace que lleva a detalleOT.html con parámetros ot y folderId
      tableRows += `
        <tr>
          <td><a href="detalleOT.html?ot=${encodeURIComponent(ot)}&folderId=${otFolder.id}" target="_blank">${ot}</a></td>
          <td>${status}</td>
          <td>${cliente}</td>
          <td>${dibujosCount}</td>
          <td>${piezas}</td>
          <td>${fechaEntrega}</td>
          <td>${relevancia}</td>
        </tr>
      `;
    }

    // Insertar las filas en la tabla
    const tableBody = document.querySelector("#tabla-OTs tbody");
    tableBody.innerHTML = tableRows;
  } catch (error) {
    console.error("Error al listar las OT's asignadas:", error);
    alert("Ocurrió un error al listar las OT's asignadas.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnListarOTs = document.getElementById('btnListarOTs');
  btnListarOTs.addEventListener('click', listarOTsAsignadas);
});


document.addEventListener('DOMContentLoaded', async () => {
  // Extraer parámetros de la URL: ot y folderId
  const params = new URLSearchParams(window.location.search);
  const ot = params.get('ot');
  const folderId = params.get('folderId');

  // Actualizar el encabezado
  document.getElementById('otHeader').textContent = ot;

  try {
    // Verificar si hay una cuenta activa en MSAL
    let activeAccount = msalInstance.getActiveAccount();

    if (!activeAccount) {
      // Si no hay cuenta activa, iniciar sesión
      const loginResponse = await msalInstance.loginPopup();
      msalInstance.setActiveAccount(loginResponse.account);
      activeAccount = loginResponse.account;
    }

    // Obtener token de acceso después de iniciar sesión
    const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ["Files.Read.All"] });
    const accessToken = tokenResponse.accessToken;

    // 1. Obtener los archivos dentro de la subcarpeta de la OT
    const childrenResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const childrenData = await childrenResponse.json();

    // 2. Buscar el archivo .txt para extraer avisos y otros datos
    const txtFile = childrenData.value.find(item => item.name.toLowerCase().endsWith(".txt"));
    let otData = {};
    if (txtFile) {
      const contentResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${txtFile.id}/content`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (contentResponse.ok) {
        const textContent = await contentResponse.text();
        const lines = textContent.split('\n');
        lines.forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim().toLowerCase().replace(/\s+/g, "");
            const value = parts.slice(1).join(':').trim();
            otData[key] = value;
          }
        });
      }
    }

    // 3. Mostrar los avisos (si existen) en la lista
    const avisosList = document.getElementById('avisosList');
    avisosList.innerHTML = "";
    if (otData["avisos"]) {
      // Se asume que los avisos pueden estar separados por comas o saltos de línea
      const avisos = otData["avisos"].split(/,|\n/).filter(a => a.trim() !== "");
      avisos.forEach(aviso => {
        avisosList.innerHTML += `<li>${aviso.trim()}</li>`;
      });
    }

    // 4. Listar los dibujos (archivos PDF)
    const dibujosList = document.getElementById('dibujosList');
    dibujosList.innerHTML = "";
    const pdfFiles = childrenData.value.filter(item => item.name.toLowerCase().endsWith(".pdf"));
    pdfFiles.forEach((pdf, index) => {
      // Aquí puedes ajustar el formato según el ejemplo que diste
      dibujosList.innerHTML += `
        <div class="drawing-item">
          <h4>Dibujo ${index + 1}</h4>
          <p>Material: ${otData["material"] || "No especificado"}</p>
          <p>Entregar en: ${otData["fechadeentrega"] || "Sin tiempo"} </p>
          <button onclick="window.open('${pdf['@microsoft.graph.downloadUrl']}', '_blank');">
            PDF
          </button>
          <div class="timer-controls">
            <button class="btn-start">Iniciar</button>
            <button class="btn-pause">Pausar</button>
            <button class="btn-stop">Finalizar</button>
            <span class="timer-display">00:00:00</span>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error al cargar el detalle de la OT:", error);
    alert("Ocurrió un error al cargar el detalle de la OT.");
  }
});





document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  btnLogin.addEventListener('click', async () => {
    await login();
    alert("Sesión iniciada correctamente.");
  });

  const modalAsignar = document.getElementById('modal-asignar');
  const closeModal = document.querySelector('.close-modal');
  const formAsignarOT = document.getElementById('formAsignarOT');
  const operadorNombreSpan = document.getElementById('operador-nombre');
  const inputTrabajadorUPN = document.getElementById('trabajadorUPN');
  const asignarBtns = document.querySelectorAll('.btn-asignar');

  asignarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!msalInstance.getActiveAccount()) {
        alert("Primero debes iniciar sesión en OneDrive.");
        return;
      }
      const row = e.target.closest('tr');
      const operadorTD = row.querySelector('td');
      const trabajadorUPN = operadorTD.getAttribute('data-upn');
      const operadorNombre = btn.getAttribute('data-operador');
      modalAsignar.style.display = 'flex';
      operadorNombreSpan.textContent = operadorNombre;
      inputTrabajadorUPN.value = trabajadorUPN;
    });
  });

  closeModal.addEventListener('click', () => modalAsignar.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === modalAsignar) modalAsignar.style.display = 'none';
  });

  formAsignarOT.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Evento submit detectado");

    // Obtener valores de los campos de texto
    const otValue = document.getElementById('ot').value;
    const tiempoValue = document.getElementById('tiempo').value;
    const avisosValue = document.getElementById('avisos').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value; // Nuevo campo para fecha de entrega

    // Obtener la checklist (checkboxes seleccionados)
    const checkboxes = document.querySelectorAll('.checklist-maquinado input[type="checkbox"]:checked');
    let maquinadoSeleccionado = [];
    checkboxes.forEach(cb => { 
      maquinadoSeleccionado.push(cb.value); 
    });

    // En este caso, solo se utilizan los archivos de dibujos generados dinámicamente
    const dibujoFiles = document.querySelectorAll('#contenedorDibujos input[type="file"]');
    const trabajadorUPN = inputTrabajadorUPN.value;

    // Verificar que se haya seleccionado al menos un archivo de dibujo
    if (dibujoFiles.length === 0) {
      alert("Selecciona al menos un dibujo.");
      return;
    }

    try {
      let account = msalInstance.getActiveAccount();
      if (!account) {
        alert("No hay sesión activa. Inicia sesión primero.");
        return;
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        scopes: ["Files.ReadWrite.All"],
        account
      });
      const accessToken = tokenResponse.accessToken;

      // 1. Verificar o crear la carpeta principal "OTsAsignadas"
      const carpetaPrincipalId = await verificarOCrearCarpeta(trabajadorUPN, "OTsAsignadas", accessToken);

      // 2. Dentro de "OTsAsignadas", crear o verificar la subcarpeta con el número de OT
      const subcarpetaNombre = `OT_${otValue}`;
      const subcarpetaId = await verificarOCrearSubcarpeta(trabajadorUPN, carpetaPrincipalId, subcarpetaNombre, accessToken);

      // 3. Crear el contenido del archivo de texto, incluyendo la fecha de entrega
      const textContent = `OT: ${otValue}\nTiempo: ${tiempoValue}\nFecha de Entrega: ${fechaEntrega}\nAvisos: ${avisosValue}\nMaquinado: ${maquinadoSeleccionado.join(', ')}`;
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      await subirArchivoOneDrive(trabajadorUPN, subcarpetaId, `Aviso_${otValue}.txt`, textBlob, accessToken);

      // 4. Subir los archivos de dibujo generados dinámicamente
      for (let i = 0; i < dibujoFiles.length; i++) {
        const file = dibujoFiles[i].files[0];
        if (file) {
          await subirArchivoOneDrive(trabajadorUPN, subcarpetaId, `${otValue}_Dibujo${i + 1}.pdf`, file, accessToken);
        }
      }

      alert(`OT asignada a ${trabajadorUPN}. Archivos subidos correctamente.`);
      modalAsignar.style.display = 'none';
      formAsignarOT.reset();
    } catch (error) {
      console.error("Error en asignar OT:", error);
      alert("Ocurrió un error al asignar la OT.");
    }
  });
});

// Función para verificar o crear una carpeta en la raíz (ejemplo: "OTsAsignadas")
async function verificarOCrearCarpeta(userUPN, carpetaNombre, token) {
  const url = `https://graph.microsoft.com/v1.0/users/${userUPN}/drive/root/children`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    console.error("Error al verificar carpeta:", await response.json());
    throw new Error("No se pudo verificar la carpeta en OneDrive.");
  }

  const data = await response.json();
  const carpeta = data.value.find(item => item.name === carpetaNombre && item.folder);
  
  if (carpeta) {
    return carpeta.id;
  } else {
    const createResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: carpetaNombre,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });

    if (!createResponse.ok) {
      console.error("Error al crear carpeta:", await createResponse.json());
      throw new Error("No se pudo crear la carpeta en OneDrive.");
    }

    const newFolder = await createResponse.json();
    return newFolder.id;
  }
}

// Función para verificar o crear una subcarpeta dentro de una carpeta padre
async function verificarOCrearSubcarpeta(userUPN, parentFolderId, subcarpetaNombre, token) {
  const url = `https://graph.microsoft.com/v1.0/users/${userUPN}/drive/items/${parentFolderId}/children`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    console.error("Error al verificar subcarpeta:", await response.json());
    throw new Error("No se pudo verificar la subcarpeta en OneDrive.");
  }

  const data = await response.json();
  const subcarpeta = data.value.find(item => item.name === subcarpetaNombre && item.folder);
  
  if (subcarpeta) {
    return subcarpeta.id;
  } else {
    const createResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: subcarpetaNombre,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });

    if (!createResponse.ok) {
      console.error("Error al crear subcarpeta:", await createResponse.json());
      throw new Error("No se pudo crear la subcarpeta en OneDrive.");
    }

    const newSubFolder = await createResponse.json();
    return newSubFolder.id;
  }
}

// Función para subir archivos a una carpeta específica
async function subirArchivoOneDrive(userUPN, folderId, fileName, fileData, token) {
  const uploadUrl = `https://graph.microsoft.com/v1.0/users/${userUPN}/drive/items/${folderId}:/${fileName}:/content`;
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': fileData.type
    },
    body: fileData
  });

  if (!response.ok) {
    console.error("Error al subir archivo:", await response.json());
    throw new Error("No se pudo subir el archivo.");
  }

  return response.json();
}

// Ejemplo: Generar dinámicamente los campos de dibujo
// Puedes activar esta generación mediante otro mecanismo o botón
document.getElementById('numDibujos').addEventListener('change', (e) => {
  const num = parseInt(e.target.value, 10);
  const contenedor = document.getElementById('contenedorDibujos');
  contenedor.innerHTML = '';

  for (let i = 1; i <= num; i++) {
    const campo = document.createElement('div');
    campo.innerHTML = `
      <label for="dibujo${i}">Dibujo ${i}:</label>
      <input type="file" id="dibujo${i}" name="dibujo${i}" accept="application/pdf, image/*" required>
    `;
    contenedor.appendChild(campo);
  }
});




document.addEventListener('DOMContentLoaded', () => {
  const fechaInput = document.getElementById('fechaAviso');
  if(fechaInput) {
    const hoy = new Date();
    fechaInput.value = hoy.toISOString(); // o formatearla a tu preferencia
  }
});

//////////////////////////////////////////para el dashboard operador 





/**
 * (Opcional) Cargar una gráfica real usando Chart.js
 */
// function cargarGraficaSemanal(stats, containerId) {
//   const ctx = document.getElementById(containerId).getContext('2d');
//   new Chart(ctx, {
//     type: 'line',
//     data: { ... },
//     options: { ... }
//   });
// }

/**
 * (Opcional) Actualizar un calendario con las fechas de entrega, etc.
 */
// function actualizarCalendario(stats, calendarBoxId) {
//   const calendarBox = document.getElementById(calendarBoxId);
//   // Lógica para mostrar las fechas relevantes
// }
