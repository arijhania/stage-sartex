// js/machines.js

/********* Bootstrap ROLE (user par défaut si accès direct) *********/
let role = sessionStorage.getItem('role');
const isAuthenticated = sessionStorage.getItem('auth') === '1';
if (!role) {
  role = 'user';
  sessionStorage.setItem('role', 'user');
} else if (role === 'admin' && !isAuthenticated) {
  // Si quelqu'un tente d'être admin sans passer par login, on le downgrade en user
  role = 'user';
  sessionStorage.setItem('role', 'user');
}

/********* Bootstrap ATELIER *********/
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
// Essaie: session -> query -> défaut "1"
let atelierId = sessionStorage.getItem('atelierId') || getQueryParam('atelierId') || '1';
sessionStorage.setItem('atelierId', atelierId);

/********* Références DOM *********/
document.getElementById('atelierTitle').textContent = `Machines - Atelier ${atelierId}`;

const machineListDiv = document.getElementById('machineList');
const canvasWrapper   = document.getElementById('canvas-wrapper');
const canvas          = document.getElementById('canvas');
const minimapCanvas   = document.getElementById('minimap-canvas');
const addBtn          = document.getElementById('addMachineBtn');
const machineModal    = document.getElementById('machineModal');
const modalTitle      = document.getElementById('modalTitle');
const machineCodeInput= document.getElementById('machineCode');
const machineNameInput= document.getElementById('machineName');
const saveMachineBtn  = document.getElementById('saveMachineBtn');
const logoutBtn       = document.getElementById('logoutBtn');
const backBtn         = document.getElementById('backBtn');
const infoModal       = document.getElementById('infoModal');
const machineInfoDiv  = document.getElementById('machineInfo');
const searchInput     = document.getElementById('searchInput');
const removeBtn       = document.getElementById('removeFromPlanBtn');
const toggleSidebarBtn= document.getElementById('toggleSidebarBtn');

const statusControls  = document.getElementById('statusControls');
const statusSelect    = document.getElementById('statusSelect');
const updateStatusBtn = document.getElementById('updateStatusBtn');

/********* Couleurs statut *********/
const STATUS_COLORS = {
  running: 'green',
  stopped: 'red',
  idle: 'orange'
};

/********* États *********/
let machinesSidebar = [];
let machinesCanvas  = [];
let editMachineId   = null;
let selectedMachineId = null;
let sidebarVisible  = true;

/********* Permissions UI *********/
if (role !== 'admin') {
  // Cacher les actions d'admin
  addBtn.style.display = 'none';
  if (statusControls) statusControls.style.display = 'none';
  removeBtn.style.display = 'none';
}

/********* Zoom *********/
let scale = 1;
function applyZoom() {
  canvas.style.transform = `scale(${scale})`;
}

/********* Navigation *********/
backBtn.addEventListener('click', () => { window.location.href = 'ateliers.html'; });
logoutBtn.addEventListener('click', () => { sessionStorage.clear(); window.location.href = 'index.html'; });

/********* Toggle sidebar *********/
toggleSidebarBtn.addEventListener('click', () => {
  sidebarVisible = !sidebarVisible;
  document.getElementById('sidebar').style.display = sidebarVisible ? 'flex' : 'none';
});

/********* Ajouter (admin) *********/
if (role === 'admin') {
  addBtn.addEventListener('click', () => {
    editMachineId = null;
    modalTitle.textContent = 'Ajouter Machine';
    machineCodeInput.value = '';
    machineNameInput.value = '';
    machineModal.style.display = 'flex';
  });
}

/********* Fermer modals *********/
window.addEventListener('click', e => {
  if (e.target === machineModal) machineModal.style.display = 'none';
  if (e.target === infoModal)    infoModal.style.display = 'none';
});

/********* Charger machines *********/
async function loadMachines() {
  const resSidebar = await fetch(`http://localhost:3000/api/machines?atelierId=${atelierId}&scope=sidebar`);
  machinesSidebar = await resSidebar.json();
  renderSidebar();

  const resCanvas = await fetch(`http://localhost:3000/api/machines?atelierId=${atelierId}&scope=canvas`);
  machinesCanvas = await resCanvas.json();
  renderCanvas();
}

/********* Sidebar *********/
function renderSidebar() {
  machineListDiv.innerHTML = '';
  const filtered = machinesSidebar.filter(m => m.nom.toLowerCase().includes(searchInput.value.toLowerCase()));
  filtered.forEach(m => {
    const div = document.createElement('div');
    div.className = 'machine-item';
    div.textContent = m.nom;
    div.dataset.id = m.id;
    // Drag source uniquement pour admin
    if (role === 'admin') {
      div.draggable = true;
      div.addEventListener('dragstart', dragStart);
    }
    machineListDiv.appendChild(div);
  });
}
searchInput.addEventListener('input', renderSidebar);

/********* Drag & Drop *********/
let draggedId = null;
function dragStart(e){ draggedId = e.target.dataset.id; }
canvas.addEventListener('dragover', e => {
  // On n'autorise pas le drop si user
  if (role !== 'admin') return;
  e.preventDefault();
});
canvas.addEventListener('drop', async e => {
  if (role !== 'admin') return alert("Droits insuffisants !");
  if (!draggedId) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  await fetch(`http://localhost:3000/api/machines/${draggedId}`, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ x, y })
  });
  draggedId = null;
  loadMachines();
});

/********* Canvas *********/
function renderCanvas() {
  canvas.innerHTML = '';
  machinesCanvas.forEach(m => {
    const div = document.createElement('div');
    div.className = 'canvas-machine';
    div.style.left = m.x + 'px';
    div.style.top  = m.y + 'px';
    div.dataset.id = m.id;

    const label = document.createElement('div');
    label.className = 'machine-label';
    label.style.background = STATUS_COLORS[m.status] || 'gray';
    label.innerHTML = `${m.nom} - ${m.status || 'stopped'}`;
    div.appendChild(label);

    const img = document.createElement('img');
    img.src = 'img/machine.jfif';
    img.alt = m.nom;
    img.onclick = async () => {
      const res  = await fetch(`http://localhost:3000/api/machines/${m.id}`);
      const info = await res.json();
      selectedMachineId = m.id;
      machineInfoDiv.innerHTML = `
        <p>ID: ${info.id}</p>
        <p>Code: ${info.code}</p>
        <p>Nom: ${info.nom}</p>
        <p>Status: ${info.status}</p>
        <p>X: ${info.x}</p>
        <p>Y: ${info.y}</p>
      `;
      if (statusSelect) statusSelect.value = info.status || 'stopped';
      infoModal.style.display = 'flex';
    };
    div.appendChild(img);

    // Déplacement des machines uniquement pour admin
    if (role === 'admin') {
      div.onmousedown = dragMouseDown;
    } else {
      div.style.cursor = 'default';
    }

    canvas.appendChild(div);
  });

  renderMinimap();
}

/********* Drag sur le canvas (admin) *********/
let offsetX = 0, offsetY = 0, currentDiv = null;
function dragMouseDown(e) {
  if (role !== 'admin') return; // sécurité
  e.preventDefault();
  currentDiv = e.target.closest('.canvas-machine');
  offsetX = e.clientX - currentDiv.offsetLeft;
  offsetY = e.clientY - currentDiv.offsetTop;
  document.onmousemove = elementDrag;
  document.onmouseup   = closeDragElement;
}
async function elementDrag(e) {
  e.preventDefault();
  currentDiv.style.left = ((e.clientX - offsetX) / scale) + 'px';
  currentDiv.style.top  = ((e.clientY - offsetY) / scale) + 'px';
}
async function closeDragElement() {
  document.onmouseup = null;
  document.onmousemove = null;
  if (!currentDiv) return;
  const id = currentDiv.dataset.id;
  const x = parseInt(currentDiv.style.left);
  const y = parseInt(currentDiv.style.top);
  await fetch(`http://localhost:3000/api/machines/${id}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ x, y })
  });
  loadMachines();
  currentDiv = null;
}

/********* Ajouter / Modifier (admin) *********/
if (role === 'admin') {
  saveMachineBtn.addEventListener('click', async () => {
    const code = machineCodeInput.value.trim();
    const nom  = machineNameInput.value.trim();
    if (!code || !nom) return alert('Code et Nom requis');

    if (editMachineId) {
      await fetch(`http://localhost:3000/api/machines/${editMachineId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code, nom })
      });
    } else {
      // Nouveau : statut par défaut cohérent avec la palette => "stopped"
      await fetch('http://localhost:3000/api/machines', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code, nom, atelier_id: atelierId, x:0, y:0, status:'stopped' })
      });
    }
    machineModal.style.display = 'none';
    loadMachines();
  });
}

/********* Modifier statut (admin) *********/
if (role === 'admin') {
  updateStatusBtn.addEventListener('click', async () => {
    if (!selectedMachineId) return;
    const newStatus = statusSelect.value;
    await fetch(`http://localhost:3000/api/machines/${selectedMachineId}`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    infoModal.style.display = 'none';
    loadMachines();
  });
}

/********* Mini-map *********/
function renderMinimap() {
  minimapCanvas.innerHTML = '';
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = minimapCanvas.clientWidth  / (canvasRect.width  / scale);
  const scaleY = minimapCanvas.clientHeight / (canvasRect.height / scale);

  machinesCanvas.forEach(m => {
    const mini = document.createElement('div');
    mini.className = 'minimap-machine';
    mini.style.left = (m.x * scaleX) + 'px';
    mini.style.top  = (m.y * scaleY) + 'px';
    mini.title = m.nom;
    mini.onclick = () => {
      canvasWrapper.scrollLeft = m.x - canvasRect.width  / 2;
      canvasWrapper.scrollTop  = m.y - canvasRect.height / 2;
    };
    minimapCanvas.appendChild(mini);
  });
}

/********* Retirer du plan (admin) *********/
if (role === 'admin') {
  removeBtn.addEventListener('click', async () => {
    if (!selectedMachineId) return;
    const index = machinesCanvas.findIndex(m => m.id === selectedMachineId);
    if (index === -1) return;
    const machine = machinesCanvas[index];
    machinesCanvas.splice(index, 1);
    machinesSidebar.push({ ...machine, x:null, y:null });
    await fetch(`http://localhost:3000/api/machines/${selectedMachineId}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ x:null, y:null })
    });
    infoModal.style.display = 'none';
    renderSidebar();
    renderCanvas();
  });
}

/********* Zoom controls *********/
document.getElementById('zoomInBtn').addEventListener('click', () => { scale *= 1.2; applyZoom(); renderMinimap(); });
document.getElementById('zoomOutBtn').addEventListener('click', () => { scale /= 1.2; applyZoom(); renderMinimap(); });
document.getElementById('resetZoomBtn').addEventListener('click', () => { scale = 1; applyZoom(); renderMinimap(); });

canvasWrapper.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.deltaY < 0) scale *= 1.1; else scale /= 1.1;
  applyZoom();
  renderMinimap();
});

/********* Go *********/
loadMachines();
