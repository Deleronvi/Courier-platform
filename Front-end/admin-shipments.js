const token = localStorage.getItem("token");

fetch("http://localhost:3000/api/admin/shipments", {
  headers: { Authorization: "Bearer " + token }
})
.then(r => r.json())
.then(rows => {
  const tbody = document.getElementById("shipments");

  rows.forEach(s => {
    tbody.innerHTML += `
      <tr class="border">
        <td>${s.id}</td>
        <td>${s.sender_email}</td>
        <td>${s.courier_email || "-"}</td>
        <td>${s.status}</td>
        <td>${new Date(s.created_at).toLocaleString()}</td>
        <td class="space-x-2">
          <button onclick="cancel(${s.id})" class="text-red-600">Cancel</button>
          <button onclick="deliver(${s.id})" class="text-green-600">Deliver</button>
        </td>
      </tr>`;
  });
});

function cancel(id) {
  fetch(`http://localhost:3000/api/admin/shipments/${id}/cancel`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token }
  }).then(() => location.reload());
}

function deliver(id) {
  fetch(`http://localhost:3000/api/admin/shipments/${id}/deliver`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token }
  }).then(() => location.reload());
}
