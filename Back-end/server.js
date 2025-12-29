const express = require("express");
const db = require("./db");
const authRoutes = require("./routes/auth");

const app = express(); 
app.use(express.json()); 


app.use("/api/auth", authRoutes); // /api/auth/register and /api/auth/login

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
