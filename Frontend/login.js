
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Basic validation
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include' // Important for session cookies
    });

    const data = await response.json();

    if (response.ok) {
      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      
      // Redirect to main page
      window.location.href = 'mainpage.html';
    } else {
      if (data.error === 'Invalid credentials') {
        alert('Invalid username or password. Please try again.');
      } else {
        alert(data.error || 'Login failed. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    alert('Connection error. Please make sure the server is running and try again.');
  }
});
