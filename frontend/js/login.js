const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('errorMsg');

loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // Utilisateurs hardcodés pour test
  const users = [
    {username: 'admin', password: '1234', role: 'admin'},
    {username: 'user', password: '1234', role: 'user'}
  ];

  const user = users.find(u => u.username === username && u.password === password);

  if(user){
    // Sauvegarder rôle + username
    sessionStorage.setItem('role', user.role);
    sessionStorage.setItem('username', user.username);

    // Redirection vers la page ateliers
    window.location.href = 'ateliers.html';
  } else {
    errorMsg.style.display = 'block';
  }
});
