alert("AUTH.JS LOADED FROM THIS FILE");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const formTitle = document.getElementById("formTitle");
const toggleText = document.getElementById("toggleText");
const msg = document.getElementById("msg");

let isLogin = true;

function toggleForm() {
  isLogin = !isLogin;
  loginForm.classList.toggle("hidden");
  registerForm.classList.toggle("hidden");
  formTitle.textContent = isLogin ? "Login" : "Create Account";
  toggleText.textContent = isLogin
    ? "Don't have an account?"
    : "Already have an account?";
  document.querySelector("p button").textContent = 
  isLogin ? "Create Account" : "Back to Login";
msg.textContent = "";
}

/* LOGIN */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginEmail.value;
  const password = loginPassword.value;

  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.msg;
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("email", email);

 if (data.role === "business") {
  window.location.href = "./sender.html";
} else if (data.role === "courier") {
  window.location.href = "./driver.html";
} else if (data.role === "admin") {
  window.location.href = "./admin.html";
} else {
  msg.textContent = "Unknown role";
}



});

/* REGISTER */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

   if (regPassword.value.length < 8) {
    msg.textContent = "Password must be at least 8 characters";
    return;
  }
  const payload = {
    email: regEmail.value,
    password: regPassword.value,
    confirmPassword: regConfirm.value,
    role: regRole.value
  };

  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.msg;
    return;
  }

  msg.classList.remove("text-red-500");
  msg.classList.add("text-green-600");
  msg.textContent = "Account created. Please login.";
  toggleForm();
});
