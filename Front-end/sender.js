const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

if (!token) location.href = "index.html";

document.getElementById("userEmail").textContent = email;

const list = document.getElementById("shipmentsList");

/* ================================
   LOAD SHIPMENTS + INLINE CHAT
================================ */
async function loadShipments() {
  const res = await fetch("http://localhost:3000/api/shipments/mine", {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  list.innerHTML = "";

  let awaiting = 0,
      transit = 0,
      delivered = 0;

  data.forEach(s => {
    if (s.status === "pending") awaiting++;
    if (s.status === "in_transit") transit++;
    if (s.status === "delivered") delivered++;

    list.innerHTML += `
      <div class="border p-4 rounded mb-4">
        <p><strong>From:</strong> ${s.pickup_address}</p>
        <p><strong>To:</strong> ${s.dropoff_address}</p>
        <p>Status: ${s.status}</p>

        ${s.courier_email
          ? `
            <p class="text-sm text-green-600">
              Driver: ${s.courier_email}
            </p>

            <!-- INLINE CHAT -->
            <div class="mt-3 border-t pt-3">
              <div id="chat-${s.id}"
                class="h-32 overflow-y-auto bg-gray-100 p-2 mb-2 text-sm">
              </div>

              <input id="msg-${s.id}"
                class="border p-1 w-full mb-1"
                placeholder="Message driver..." />

              <button onclick="sendMsg(${s.id}, ${s.courier_id})"
                class="bg-blue-600 text-white px-2 py-1 rounded">
                Send
              </button>
            </div>
          `
          : `<p class="text-sm text-gray-400">No driver yet</p>`
        }

        ${s.status === "pending"
          ? `<button onclick="cancelShipment(${s.id})"
              class="mt-2 text-red-600">
              Cancel
            </button>`
          : ""
        }
      </div>
    `;
  });

  document.getElementById("awaiting").textContent = awaiting;
  document.getElementById("transit").textContent = transit;
  document.getElementById("delivered").textContent = delivered;
}

/* ================================
   CREATE SHIPMENT
================================ */
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

/* ================================
   CHAT LOGIC (INLINE)
================================ */
function loadChat(id) {
  fetch(`http://localhost:3000/api/messages/${id}`, {
    headers: { Authorization: "Bearer " + token }
  })
    .then(r => r.json())
    .then(msgs => {
      const box = document.getElementById(`chat-${id}`);
      if (!box) return;

      box.innerHTML = msgs
        .map(m => `<p class="mb-1">${m.message}</p>`)
        .join("");

      box.scrollTop = box.scrollHeight;
    });
}

function sendMsg(id, driverId) {
  const input = document.getElementById(`msg-${id}`);
  if (!input || !input.value.trim()) return;

  fetch(`http://localhost:3000/api/messages/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      receiver_id: driverId,
      message: input.value
    })
  }).then(() => {
    input.value = "";
    loadChat(id);
  });
}

/* AUTO-REFRESH ALL CHATS */
setInterval(() => {
  document.querySelectorAll("[id^='chat-']").forEach(div => {
    const id = div.id.split("-")[1];
    loadChat(id);
  });
}, 3000);

/* ================================
   CANCEL SHIPMENT
================================ */
async function cancelShipment(id) {
  await fetch(`http://localhost:3000/api/shipments/${id}/cancel`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });
  loadShipments();
}

/* ================================
   LOGOUT
================================ */
function logout() {
  localStorage.clear();
  location.href = "index.html";
}

/* INITIAL LOAD */
loadShipments();
