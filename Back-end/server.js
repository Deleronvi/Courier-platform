const express = require("express");
const db = require("./db");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express(); 
app.use(express.json()); 
app.use(cors()); 
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes); // /api/auth/register and /api/auth/login
app.use("/api/messages", require("./routes/messages"));

app.get("/", (req, res) => {
  res.send("Courier Platform API running");
});

// test DB
app.get("/users", (req, res) => {
  db.query("SELECT id, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

const shipmentRoutes = require("./routes/shipments");
app.use("/api/shipments", shipmentRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
