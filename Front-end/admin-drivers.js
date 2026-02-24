const token = localStorage.getItem("token");

async function loadDrivers() {
  const res = await fetch("http://localhost:3000/api/admin/drivers", {
    headers: { Authorization: "Bearer " + token }
  });

  const drivers = await res.json();
  const table = document.getElementById("driversTable");

  table.innerHTML = drivers.map(d => `
    <tr class="border-b hover:bg-gray-50">
      <td>${d.email}</td>
      <td>${d.deliveries || 0}</td>
      <td>${d.cancelled || 0}</td>
      <td>
        <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
          ${d.avg_rating || "—"}
        </span>
      </td>
      <td>
        <span class="${d.is_online ? 'text-green-600 font-semibold' : 'text-gray-400'}">
          ${d.is_online ? "Online" : "Offline"}
        </span>
      </td>
      <td>
        <span class="${d.status === 'active' ? 'text-green-600' : 'text-red-500'}">
          ${d.status}
        </span>
      </td>
      <td>
        <button 
          onclick="toggleStatus(${d.id}, '${d.status || "active"}')"
          class="text-sm px-3 py-1 rounded ${
            d.status === 'active'
              ? 'bg-red-100 text-red-600'
              : 'bg-green-100 text-green-600'
          }">
          ${d.status === 'active' ? "Block" : "Unblock"}
        </button>
      </td>
    </tr>
  `).join("");
}

async function toggleStatus(id, currentStatus) {
    console.log("Clicked", id, currentStatus);
  const newStatus = currentStatus === "active" ? "blocked" : "active";

  const res = await fetch(`http://localhost:3000/api/admin/users/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ status: newStatus })
  });

  if (!res.ok) {
    alert("Failed to update status");
    return;
  }

  loadDrivers();
}

loadDrivers();