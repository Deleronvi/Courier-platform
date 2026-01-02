const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* AUTH MIDDLEWARE */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* CREATE SHIPMENT (SENDER) */
router.post("/", auth, (req, res) => {
  const { pickup_address, dropoff_address, receiver_info } = req.body;

  if (!pickup_address || !dropoff_address || !receiver_info)
    return res.status(400).json({ msg: "All fields required" });

  db.query(
    `INSERT INTO shipments 
     (sender_id, pickup_address, dropoff_address, receiver_info)
     VALUES (?, ?, ?, ?)`,
    [req.user.id, pickup_address, dropoff_address, receiver_info],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Shipment created" });
    }
  );
});

/* GET SENDER SHIPMENTS */
router.get("/mine", auth, (req, res) => {
  db.query(
    `SELECT s.*, u.email AS courier_email
     FROM shipments s
     LEFT JOIN users u ON s.courier_id = u.id
     WHERE s.sender_id = ?
     ORDER BY s.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});


/* GET AVAILABLE SHIPMENTS (COURIER) */
router.get("/available", auth, (req, res) => {
  db.query(
    `SELECT id, pickup_address, dropoff_address, status
     FROM shipments
     WHERE status = 'pending'`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* ACCEPT SHIPMENT */
router.post("/:id/accept", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET courier_id = ?, status = 'in_transit'
     WHERE id = ? AND status = 'pending'`,
    [req.user.id, req.params.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Job accepted" });
    }
  );
});


/* COURIER ACTIVE JOBS */
router.get("/my-jobs", auth, (req, res) => {
  db.query(
    `SELECT * FROM shipments
     WHERE courier_id = ? AND status = 'in_transit'`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

router.post("/:id/cancel", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET status='cancelled'
     WHERE id=? AND sender_id=? AND status='pending'`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Cancelled" });
    }
  );
});

router.post("/:id/driver-cancel", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET status='cancelled'
     WHERE id=? AND courier_id=?`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Job cancelled" });
    }
  );
});
/* MARK SHIPMENT AS DELIVERED */
router.post("/:id/deliver", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET status = 'delivered'
     WHERE id = ?
       AND courier_id = ?
       AND status = 'in_transit'`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Shipment delivered" });
    }
  );
});

module.exports = router;
