const socket = io("http://localhost:3000");
  socket.on("shipmentUpdated", () => {
  console.log("Shipment update received (driver)");

  loadDashboard();
});
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

let statusChartInstance;
let dayChartInstance;

if (!token || role !== "admin") location.href = "index.html";

async function loadDashboard() {

  try {

    /* ---------- LOAD STATS ---------- */
    const statsRes = await fetch("http://localhost:3000/api/admin/stats", {
      headers: { Authorization: "Bearer " + token }
    });

    if (!statsRes.ok) throw new Error("Stats failed");

    const stats = await statsRes.json();

    document.getElementById("totalUsers").textContent = stats.users || 0;
    document.getElementById("activeDrivers").textContent = stats.couriers || 0;
    document.getElementById("totalShipments").textContent = stats.shipments || 0;
    document.getElementById("deliveredCount").textContent = stats.delivered || 0;
    document.getElementById("pendingCount").textContent = stats.pending || 0;
    document.getElementById("cancelledCount").textContent = stats.cancelled || 0;

    /* ---------- LOAD REPORTS ---------- */
    const reportRes = await fetch("http://localhost:3000/api/admin/reports", {
      headers: { Authorization: "Bearer " + token }
    });

    if (!reportRes.ok) throw new Error("Reports failed");

    const report = await reportRes.json();

    /* ---------- STATUS CHART ---------- */
if (report.byStatus && report.byStatus.length) {

  if (statusChartInstance) {
    statusChartInstance.destroy();
  }

  statusChartInstance = new Chart(
    document.getElementById("statusChart"),
    {
      type: "bar",
      data: {
        labels: report.byStatus.map(r => r.status),
        datasets: [{
          label: "Shipments",
          data: report.byStatus.map(r => r.count)
        }]
      }
    }
  );
}

    /* ---------- DAY CHART ---------- */
if (report.byDay && report.byDay.length) {

  if (dayChartInstance) {
    dayChartInstance.destroy();
  }

  dayChartInstance = new Chart(
    document.getElementById("dayChart"),
    {
      type: "line",
      data: {
        labels: report.byDay.map(r => r.day),
        datasets: [{
          label: "Shipments",
          data: report.byDay.map(r => r.count)
        }]
      }
    }
  );
}

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

loadDashboard();