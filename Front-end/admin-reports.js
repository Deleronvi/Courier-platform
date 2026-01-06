const token = localStorage.getItem("token");

fetch("http://localhost:3000/api/admin/reports", {
  headers: { Authorization: "Bearer " + token }
})
.then(r => r.json())
.then(data => {
  document.getElementById("status").innerHTML =
    "<h3 class='font-bold'>By Status</h3>" +
    data.byStatus.map(s => `<p>${s.status}: ${s.count}</p>`).join("");

  document.getElementById("daily").innerHTML =
    "<h3 class='font-bold mt-4'>By Day</h3>" +
    data.byDay.map(d => `<p>${d.day}: ${d.count}</p>`).join("");
});
