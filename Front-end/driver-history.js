const token = localStorage.getItem("token");
if (!token) location.href = "index.html";

const box = document.getElementById("historyBox");

async function loadHistory() {
  const res = await fetch("http://localhost:3000/api/shipments/my-history", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  box.innerHTML = "";

  if (data.length === 0) {
    box.innerHTML = `<p class="text-gray-500">No completed deliveries yet.</p>`;
    return;
  }

  data.forEach(s => {
    box.innerHTML += `
      <div class="bg-white p-4 rounded shadow mb-4">
        <p><strong>From:</strong> ${s.pickup_address}</p>
        <p><strong>To:</strong> ${s.dropoff_address}</p>
        <p><strong>Delivered:</strong> ${new Date(s.delivered_at).toLocaleString()}</p>
      </div>
    `;
  });
}

loadHistory();