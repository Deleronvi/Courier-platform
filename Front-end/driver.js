const token = localStorage.getItem("token");
const email = localStorage.getItem("email");

if (!token) location.href = "index.html";

document.getElementById("userEmail").textContent = email;

const availableBox = document.getElementById("availableJobs");
const activeBox = document.getElementById("activeJobs");
const title = document.getElementById("availableTitle");

/* LOAD AVAILABLE JOBS */
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

/* LOAD ACTIVE JOBS */
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
      </div>
    `;
  });
}

/* ACCEPT JOB */
async function acceptJob(id) {
  await fetch(`http://localhost:3000/api/shipments/${id}/accept`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token }
  });

  loadJobs();
  loadActiveJobs();
}

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

/* INITIAL LOAD */
loadJobs();
loadActiveJobs();
