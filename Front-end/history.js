const token = localStorage.getItem("token");
const hidden = JSON.parse(localStorage.getItem("hiddenShipments")) || [];

if (!token) location.href = "index.html";

async function loadHistory() {
  const res = await fetch("http://localhost:3000/api/shipments/mine", {
    headers: { Authorization: "Bearer " + token }
  });

  const shipments = await res.json();
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const history = shipments.filter(s =>
    ["delivered", "cancelled"].includes(s.status) || hidden.includes(s.id)
  );

  if (history.length === 0) {
    list.innerHTML = `<p class="text-gray-500">No history yet.</p>`;
    return;
  }

  history.forEach(s => {
    list.innerHTML += `
      <div class="bg-white p-4 rounded shadow">
        <p><strong>From:</strong> ${s.pickup_address}</p>
        <p><strong>To:</strong> ${s.dropoff_address}</p>
        <p>Status: ${s.status}</p>
        ${hidden.includes(s.id)
          ? `<p class="text-sm text-red-500">Hidden</p>`
          : ""
        }
      </div>
    `;
  });
}

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

loadHistory();
