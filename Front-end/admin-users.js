const token = localStorage.getItem("token");

fetch("http://localhost:3000/api/admin/users", {
  headers: { Authorization: "Bearer " + token }
})
.then(r => r.json())
.then(users => {
  const tbody = document.getElementById("users");

  users.forEach(u => {
    tbody.innerHTML += `
      <tr class="border">
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.status}</td>
        <td class="space-x-2">
          <button onclick="setRole(${u.id}, 'courier')" class="text-blue-600">Courier</button>
          <button onclick="setRole(${u.id}, 'sender')" class="text-green-600">Sender</button>
          <button onclick="toggle(${u.id}, '${u.status}')" class="text-red-600">Toggle</button>
        </td>
      </tr>`;
  });
});

function setRole(id, role) {
  fetch(`http://localhost:3000/api/admin/users/${id}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ role })
  }).then(() => location.reload());
}

function toggle(id, status) {
  const newStatus = status === "active" ? "disabled" : "active";
  fetch(`http://localhost:3000/api/admin/users/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ status: newStatus })
  }).then(() => location.reload());
}
