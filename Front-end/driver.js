const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

if (!token) location.href = "index.html";

document.getElementById("userEmail").textContent = email;

const availableBox = document.getElementById("availableJobs");
const activeBox = document.getElementById("activeJobs");
const title = document.getElementById("availableTitle");

/* ================================
   LOAD AVAILABLE JOBS
================================ */
async function loadJobs() {
  const res = await fetch("http://localhost:3000/api/shipments/available", {
    headers: { Authorization: "Bearer " + token }
  });

  const jobs = await res.json();

  title.textContent = `Available Requests (${jobs.length})`;
  availableBox.innerHTML = "";

  if (jobs.length === 0) {
    availableBox.innerHTML = `<p class="text-gray-500">No available jobs.</p>`;
    return;
  }

  jobs.forEach(j => {
    availableBox.innerHTML += `
      <div class="bg-white p-6 rounded shadow mb-6">
        <p><strong>From:</strong> ${j.pickup_address}</p>
        <p><strong>To:</strong> ${j.dropoff_address}</p>
        <p>Status: ${j.status}</p>

        <button onclick="acceptJob(${j.id})"
          class="mt-4 bg-green-600 text-white px-4 py-2 rounded">
          Accept Job
        </button>
      </div>
    `;
  });
}

/* ================================
   LOAD ACTIVE JOBS + CHAT
================================ */
async function loadActiveJobs() {
  const res = await fetch("http://localhost:3000/api/shipments/my-jobs", {
    headers: { Authorization: "Bearer " + token }
  });

  const jobs = await res.json();
  activeBox.innerHTML = "";

  if (jobs.length === 0) {
    activeBox.innerHTML = `<p class="text-gray-500">No active jobs.</p>`;
    return;
  }

  jobs.forEach(j => {
    activeBox.innerHTML += `
      <div class="bg-white p-4 rounded shadow mb-4">
        <p><strong>From:</strong> ${j.pickup_address}</p>
        <p><strong>To:</strong> ${j.dropoff_address}</p>
        <p><strong>Receiver:</strong> ${j.receiver_info}</p>
        <p>Status: ${j.status}</p>

        <!-- INLINE CHAT -->
        <div class="mt-3 border-t pt-3">
          <div id="chat-${j.id}"
            class="h-32 overflow-y-auto bg-gray-100 p-2 mb-2 text-sm">
          </div>

          <input id="msg-${j.id}"
            class="border p-1 w-full mb-1"
            placeholder="Message sender..." />

          <button onclick="sendMsg(${j.id}, ${j.sender_id})"
            class="bg-blue-600 text-white px-2 py-1 rounded">
            Send
          </button>
        </div>

        ${j.status === "in_transit"
          ? `
            <button onclick="markDelivered(${j.id})"
              class="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
              Mark as Delivered
            </button>
          `
          : ""
        }

        <button onclick="cancelJob(${j.id})"
          class="mt-2 text-red-600">
          Cancel Job
        </button>
      </div>
    `;
  });
}

/* ================================
   CHAT LOGIC
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

function sendMsg(id, senderId) {
  const input = document.getElementById(`msg-${id}`);
  if (!input || !input.value.trim()) return;

  fetch(`http://localhost:3000/api/messages/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      receiver_id: senderId,
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
   ACTIONS
================================ */
async function acceptJob(id) {
  await fetch(`http://localhost:3000/api/shipments/${id}/accept`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });

  loadJobs();
  loadActiveJobs();
}

async function cancelJob(id) {
  await fetch(`http://localhost:3000/api/shipments/${id}/driver-cancel`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });
  loadActiveJobs();
}

/* ✅ MARK AS DELIVERED */
async function markDelivered(id) {
  await fetch(`http://localhost:3000/api/shipments/${id}/deliver`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });

  loadJobs();
  loadActiveJobs();
}

/* ================================
   LOGOUT
================================ */
function logout() {
  localStorage.clear();
  location.href = "index.html";
}

/* INITIAL LOAD */
loadJobs();
loadActiveJobs();
