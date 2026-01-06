const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") location.href = "index.html";

/* LOAD STATS */
async function loadStats() {
  const res = await fetch("http://localhost:3000/api/admin/stats", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  document.getElementById("totalUsers").textContent = data.users;
  document.getElementById("totalShipments").textContent = data.shipments;
  document.getElementById("activeCouriers").textContent = data.couriers;
}

loadStats();

function logout() {
  localStorage.clear();
  location.href = "index.html";
}
