const token = localStorage.getItem("token");

fetch("http://localhost:3000/api/admin/reports", {
  headers: { Authorization: "Bearer " + token }
})
.then(r => r.json())
.then(data => {

  document.getElementById("status").innerHTML = `
    <div class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-bold mb-2">Summary</h3>
      <p>Total Shipments: ${data.total}</p>
      <p>Success Rate: ${data.successRate}%</p>
      <p>Cancel Rate: ${data.cancelRate}%</p>
      <p>Top Driver: ${data.topDriver ? data.topDriver.email : "N/A"}</p>
    </div>

    <div class="bg-white p-4 rounded shadow">
      <h3 class="font-bold mb-2">By Status</h3>
      ${data.byStatus.map(s => `<p>${s.status}: ${s.count}</p>`).join("")}
    </div>
  `;

  document.getElementById("daily").innerHTML = `
    <div class="bg-white p-4 rounded shadow mt-4">
      <h3 class="font-bold mb-2">By Day</h3>
      ${data.byDay.map(d => `<p>${d.day}: ${d.count}</p>`).join("")}
    </div>
  `;
});