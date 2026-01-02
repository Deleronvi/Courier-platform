const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* get messages */
router.get("/:shipmentId", auth, (req, res) => {
  db.query(
    "SELECT * FROM messages WHERE shipment_id = ? ORDER BY created_at ASC",
    [req.params.shipmentId],
    (err, rows) => res.json(rows)
  );
});

/* send message */
router.post("/:shipmentId", auth, (req, res) => {
  const { receiver_id, message } = req.body;

  db.query(
    `INSERT INTO messages (shipment_id, sender_id, receiver_id, message)
     VALUES (?, ?, ?, ?)`,
    [req.params.shipmentId, req.user.id, receiver_id, message],
    () => res.json({ msg: "sent" })
  );
});

module.exports = router;
