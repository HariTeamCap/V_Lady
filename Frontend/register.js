
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Basic client-side validation
  if (username.length < 3) {
    alert('Username must be at least 3 characters long');
    return;
  }

  if (password.length < 3) {
    alert('Password must be at least 3 characters long');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed. Please try a different username.');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert('Connection error. Please make sure the server is running and try again.');
  }
});
