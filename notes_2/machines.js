if(!sessionStorage.getItem('atelierId')) window.location.href = 'ateliers.html';

const atelierId = sessionStorage.getItem('atelierId');
document.getElementById('atelierTitle').textContent = `Machines - Atelier ${atelierId}`;

const machineListDiv = document.getElementById('machineList');
const canvas = document.getElementById('canvas');
const addBtn = document.getElementById('addMachineBtn');
const machineModal = document.getElementById('machineModal');
const modalTitle = document.getElementById('modalTitle');
const machineCodeInput = document.getElementById('machineCode');
const machineNameInput = document.getElementById('machineName');
const saveMachineBtn = document.getElementById('saveMachineBtn');
const logoutBtn = document.getElementById('logoutBtn');
const backBtn = document.getElementById('backBtn');
const infoModal = document.getElementById('infoModal');
const machineInfoDiv = document.getElementById('machineInfo');

let machinesSidebar = [];
let machinesCanvas = [];
let editMachineId = null;

// Retour ateliers
backBtn.addEventListener('click', () => { window.location.href='ateliers.html'; });

// Logout
logoutBtn.addEventListener('click', () => { sessionStorage.clear(); window.location.href='index.html'; });

// Ouvrir modal Ajouter
addBtn.addEventListener('click', () => {
    editMachineId = null;
    modalTitle.textContent = 'Ajouter Machine';
    machineCodeInput.value = '';
    machineNameInput.value = '';
    machineModal.style.display = 'flex';
});

// Fermer modals
window.addEventListener('click', e => { 
    if(e.target === machineModal) machineModal.style.display = 'none';
    if(e.target === infoModal) infoModal.style.display = 'none';
});

// Charger machines
async function loadMachines(){
    const resSidebar = await fetch(`http://localhost:3000/api/machines?atelierId=${atelierId}&scope=sidebar`);
    machinesSidebar = await resSidebar.json();
    renderSidebar();

    const resCanvas = await fetch(`http://localhost:3000/api/machines?atelierId=${atelierId}&scope=canvas`);
    machinesCanvas = await resCanvas.json();
    renderCanvas();
}

// Render Sidebar
function renderSidebar(){
    machineListDiv.innerHTML = '';
    machinesSidebar.forEach(m => {
        const div = document.createElement('div');
        div.className = 'machine-item';
        div.textContent = m.nom;
        div.draggable = true;
        div.dataset.id = m.id;
        div.addEventListener('dragstart', dragStart);
        machineListDiv.appendChild(div);
    });
}

// Drag & Drop
let draggedId = null;
function dragStart(e){ draggedId = e.target.dataset.id; }
canvas.addEventListener('dragover', e=>e.preventDefault());
canvas.addEventListener('drop', async e=>{
    if(!draggedId) return;
    const x = e.offsetX;
    const y = e.offsetY;
    await fetch(`http://localhost:3000/api/machines/${draggedId}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({x,y})
    });
    draggedId=null;
    loadMachines();
});

// Render Canvas avec image
function renderCanvas(){
    canvas.innerHTML='';
    machinesCanvas.forEach(m=>{
        const div = document.createElement('div');
        div.className='canvas-machine';
        div.style.left=m.x+'px';
        div.style.top=m.y+'px';
        div.dataset.id=m.id;

        // Image machine
        const img = document.createElement('img');
        img.src = 'img/machine.jfif';
        img.alt = m.nom;
        div.appendChild(img);

        // Infos au clic
        img.onclick=async ()=> {
            const res = await fetch(`http://localhost:3000/api/machines/${m.id}`);
            const info = await res.json();
            machineInfoDiv.innerHTML = `
                <p>ID: ${info.id}</p>
                <p>Code: ${info.code}</p>
                <p>Nom: ${info.nom}</p>
                <p>Status: ${info.status}</p>
                <p>X: ${info.x}</p>
                <p>Y: ${info.y}</p>
            `;
            infoModal.style.display='flex';
        };

        // X Supprimer
        const xBtn = document.createElement('div');
        xBtn.className='delete-x';
        xBtn.textContent='×';
        xBtn.onclick=async e=>{
            e.stopPropagation();
            if(!confirm('Supprimer cette machine ?')) return;
            await fetch(`http://localhost:3000/api/machines/${m.id}`, {method:'DELETE'});
            loadMachines();
        };
        div.appendChild(xBtn);

        // Déplacement
        div.onmousedown=dragMouseDown;

        canvas.appendChild(div);
    });
}

// Drag déplacement canvas
let offsetX=0, offsetY=0, currentDiv=null;
function dragMouseDown(e){
    e.preventDefault();
    currentDiv=e.target.closest('.canvas-machine');
    if(e.target.classList.contains('delete-x')) return;
    offsetX=e.clientX-currentDiv.offsetLeft;
    offsetY=e.clientY-currentDiv.offsetTop;
    document.onmousemove=elementDrag;
    document.onmouseup=closeDragElement;
}
async function elementDrag(e){
    e.preventDefault();
    currentDiv.style.left=(e.clientX-offsetX)+'px';
    currentDiv.style.top=(e.clientY-offsetY)+'px';
}
async function closeDragElement(){
    document.onmouseup=null;
    document.onmousemove=null;
    const id=currentDiv.dataset.id;
    const x=parseInt(currentDiv.style.left);
    const y=parseInt(currentDiv.style.top);
    await fetch(`http://localhost:3000/api/machines/${id}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({x,y})
    });
    loadMachines();
    currentDiv=null;
}

// Ajouter / Modifier
saveMachineBtn.addEventListener('click', async ()=>{
    const code = machineCodeInput.value.trim();
    const nom = machineNameInput.value.trim();
    if(!code || !nom) return alert('Code et Nom requis');

    if(editMachineId){
        await fetch(`http://localhost:3000/api/machines/${editMachineId}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({code, nom})
        });
    } else {
        await fetch('http://localhost:3000/api/machines', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({code, nom, atelier_id: atelierId, x:0, y:0})
        });
    }
    machineModal.style.display='none';
    loadMachines();
});

loadMachines();
