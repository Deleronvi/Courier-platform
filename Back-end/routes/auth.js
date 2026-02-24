const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

require("dotenv").config();

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { email, password, confirmPassword, role } = req.body;

  if (!email || !password || !confirmPassword || !role)
    return res.status(400).json({ msg: "All fields required" });
   
  if (password.length < 8)
  return res.status(400).json({ msg: "Password must be at least 8 characters" });

  if (password !== confirmPassword)
    return res.status(400).json({ msg: "Passwords do not match" });

  const hashed = await bcrypt.hash(password, 10);

  db.query(
  "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
  [email, hashed, role],
  (err, results) => {
    if (err) {
      console.error("DB Insert Error:", err); // log the real error
      return res.status(400).json({ msg: "Database error" });
    }
    console.log("User inserted:", results);
    res.json({ msg: "Account created" });
  }
);
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (results.length === 0)
        return res.status(401).json({ msg: "Invalid credentials" });

      const user = results[0];
      const valid = await bcrypt.compare(password, user.password);

      if (!valid)
        return res.status(401).json({ msg: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token, role: user.role });
    }
  );
});




module.exports = router;
