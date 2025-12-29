// In-memory users (demo only)
const users = [];

// Create account
document.getElementById("createAccountBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  users.push({ email, password, role });
  alert("Account created (demo only)");
});

// Login
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const user = users.find(
    u => u.email === email && u.password === password && u.role === role
  );

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  alert(`Logged in as ${role}`);
});
