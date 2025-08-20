// Vérifier si connecté
if(!sessionStorage.getItem('role')) window.location.href = 'index.html';

const tableBody = document.getElementById('atelierTableBody');
const addBtn = document.getElementById('addAtelierBtn');
const modal = document.getElementById('atelierModal');
const modalTitle = document.getElementById('modalTitle');
const atelierNameInput = document.getElementById('atelierName');
const saveBtn = document.getElementById('saveAtelierBtn');
const logoutBtn = document.getElementById('logoutBtn');

let ateliers = [];
let editAtelierId = null;

// Logout
logoutBtn.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// Ouvrir modal pour ajouter
addBtn.addEventListener('click', () => {
  editAtelierId = null;
  modalTitle.textContent = "Ajouter Atelier";
  atelierNameInput.value = '';
  modal.style.display = 'flex';
});

// Fermer modal si clique en dehors
window.addEventListener('click', (e) => {
  if(e.target === modal) modal.style.display = 'none';
});

// Charger les ateliers depuis backend
async function loadAteliers(){
  try {
    const res = await fetch('http://localhost:3000/api/ateliers');
    ateliers = await res.json();
    renderTable();
  } catch(err) {
    alert('Erreur lors du chargement des ateliers');
    console.error(err);
  }
}

// Afficher dans le tableau
function renderTable(){
  tableBody.innerHTML = '';
  ateliers.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.id}</td>
      <td class="atelier-link">${a.nom}</td>
      <td>
        <button class="edit-btn" onclick="editAtelier(${a.id})">Modifier</button>
        <button class="delete-btn" onclick="deleteAtelier(${a.id})">Supprimer</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Cliquer sur nom atelier pour accéder aux machines
  document.querySelectorAll('.atelier-link').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const tr = e.target.parentElement;
      const id = tr.children[0].textContent; // récupère l'id
      sessionStorage.setItem('atelierId', id); // stocker ID atelier
      window.location.href = 'machines.html'; // rediriger vers page machines
    });
  });
}

// Ajouter ou modifier
saveBtn.addEventListener('click', async () => {
  const nom = atelierNameInput.value.trim();
  if(!nom) return alert('Nom obligatoire');

  try {
    if(editAtelierId){
      // PUT
      await fetch(`http://localhost:3000/api/ateliers/${editAtelierId}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({nom})
      });
    } else {
      // POST
      await fetch('http://localhost:3000/api/ateliers', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({nom})
      });
    }
    modal.style.display = 'none';
    loadAteliers();
  } catch(err){
    alert('Erreur lors de la sauvegarde');
    console.error(err);
  }
});

// Modifier
window.editAtelier = (id) => {
  editAtelierId = id;
  const atelier = ateliers.find(a => a.id === id);
  if(!atelier) return;
  modalTitle.textContent = "Modifier Atelier";
  atelierNameInput.value = atelier.nom;
  modal.style.display = 'flex';
};

// Supprimer
window.deleteAtelier = async (id) => {
  if(!confirm('Voulez-vous supprimer cet atelier ?')) return;
  try {
    await fetch(`http://localhost:3000/api/ateliers/${id}`, { method: 'DELETE' });
    loadAteliers();
  } catch(err){
    alert('Erreur lors de la suppression');
    console.error(err);
  }
};

// Charger au démarrage
loadAteliers();
