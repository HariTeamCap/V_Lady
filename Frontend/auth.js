// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

// Get current username
function getCurrentUsername() {
  return localStorage.getItem('username');
}

// Logout function
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  fetch('/api/logout', {
    method: 'POST',
    credentials: 'include'
  }).then(() => {
    window.location.href = 'login.html';
  }).catch(err => {
    console.error('Logout error:', err);
    window.location.href = 'login.html';
  });
}

// Update UI based on login status
function updateAuthUI() {
  const loginLink = document.querySelector('a[href="login.html"]');
  const profileLink = document.querySelector('.profile-link');
  
  if (isLoggedIn()) {
    if (loginLink) {
      const username = getCurrentUsername();
      loginLink.innerHTML = `<i class="fa fa-user"></i> ${username}`;
      loginLink.href = '#';
      loginLink.onclick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          logout();
        }
      };
    }
    if (profileLink) {
      profileLink.style.display = 'inline-block';
    }
  } else {
    if (loginLink) {
      loginLink.innerHTML = '<i class="fa fa-user"></i>';
      loginLink.href = 'login.html';
      loginLink.onclick = null;
    }
    if (profileLink) {
      profileLink.style.display = 'none';
    }
  }
}

// Call updateAuthUI when the page loads
document.addEventListener('DOMContentLoaded', updateAuthUI);