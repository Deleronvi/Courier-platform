const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

if (!token) location.href = "index.html";

document.getElementById("userEmail").textContent = email;

const list = document.getElementById("shipmentsList");

/* LOAD SHIPMENTS */
async function loadShipments() {
  const res = await fetch("http://localhost:3000/api/shipments/mine", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  list.innerHTML = "";

  let awaiting = 0, transit = 0, delivered = 0;

  data.forEach(s => {
    if (s.status === "pending") awaiting++;
    if (s.status === "in_transit") transit++;
    if (s.status === "delivered") delivered++;

    list.innerHTML += `
      <div class="border p-4 rounded mb-4">
        <p><strong>From:</strong> ${s.pickup_address}</p>
        <p><strong>To:</strong> ${s.dropoff_address}</p>
        <p>Status: ${s.status}</p>
      </div>
    `;
  });

  document.getElementById("awaiting").textContent = awaiting;
  document.getElementById("transit").textContent = transit;
  document.getElementById("delivered").textContent = delivered;
}

/* CREATE SHIPMENT */
document
  .getElementById("shipmentForm")
  .addEventListener("submit", async e => {
    e.preventDefault();

    const inputs = e.target.querySelectorAll("input");

    await fetch("http://localhost:3000/api/shipments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        pickup_address: inputs[0].value,
        dropoff_address: inputs[1].value,
        receiver_info: inputs[2].value
      })
    });

    e.target.reset();
    loadShipments();
  });

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

if (s.courier_email) {
  html += `<p class="text-sm text-green-600">
    Accepted by: ${s.courier_email}
  </p>`;
}


loadShipments();
