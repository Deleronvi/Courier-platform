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

    db.query(
      "SELECT status FROM users WHERE id = ?",
      [user.id],
      (dbErr, rows) => {
        if (dbErr || !rows.length) return res.sendStatus(403);

        if (rows[0].status !== "active") {
          return res.status(403).json({ msg: "Account blocked by admin" });
        }

        req.user = user;
        next();
      }
    );
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
    "SELECT is_online FROM users WHERE id = ?",
    [req.user.id],
    (err, result) => {

      if (err) return res.status(500).json(err);

      if (!result[0].is_online) {
        return res.json([]); // offline drivers see nothing
      }

      db.query(
        `SELECT id, pickup_address, dropoff_address, status
         FROM shipments
         WHERE status = 'pending'`,
        (err, rows) => {
          if (err) return res.status(500).json(err);
          res.json(rows);
        }
      );

    }
  );
});

/* ACCEPT SHIPMENT */
router.post("/:id/accept", auth, (req, res) => {
  db.query(
  "UPDATE shipments SET status='accepted', courier_id=?, accepted_at=NOW() WHERE id=? AND status='pending'",
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
     WHERE courier_id = ?
     AND status IN ('accepted','in_transit','awaiting_confirmation')`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* DRIVER DELIVERY HISTORY */
router.get("/my-history", auth, (req, res) => {
  db.query(
    `SELECT *
     FROM shipments
     WHERE courier_id = ?
     AND status = 'delivered'
     ORDER BY delivered_at DESC`,
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

/* START DELIVERY */
router.post("/:id/start", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET status='in_transit',
         in_transit_at=NOW()
     WHERE id=? 
       AND courier_id=? 
       AND status='accepted'`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Shipment in transit" });
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
     SET status='awaiting_confirmation'
     WHERE id=? 
       AND courier_id=? 
       AND status='in_transit'`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Waiting for sender confirmation" });
    }
  );
});

router.post("/:id/confirm", auth, (req, res) => {
  db.query(
    `UPDATE shipments
     SET status='delivered',
         delivered_at=NOW()
     WHERE id=? 
       AND sender_id=? 
       AND status='awaiting_confirmation'`,
    [req.params.id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Delivery confirmed" });
    }
  );
});

/* DRIVER GO ONLINE */
router.post("/go-online", auth, (req, res) => {
  db.query(
    "UPDATE users SET is_online = TRUE WHERE id = ?",
    [req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Now online" });
    }
  );
});

/* DRIVER GO OFFLINE */
router.post("/go-offline", auth, (req, res) => {
  db.query(
    "UPDATE users SET is_online = FALSE WHERE id = ?",
    [req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Now offline" });
    }
  );
});
/* RATE DRIVER */
router.post("/:id/rate", auth, (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ msg: "Invalid rating" });

  // Get shipment first
  db.query(
    "SELECT sender_id, courier_id, status FROM shipments WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) return res.sendStatus(404);

      const shipment = rows[0];

      if (shipment.sender_id !== req.user.id)
        return res.sendStatus(403);

      if (shipment.status !== "delivered")
        return res.status(400).json({ msg: "Not delivered yet" });

      db.query(
        `INSERT INTO ratings 
         (shipment_id, sender_id, driver_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.params.id,
          req.user.id,
          shipment.courier_id,
          rating,
          comment || null
        ],
        err => {
          if (err) return res.status(400).json({ msg: "Already rated" });
          res.json({ msg: "Rating submitted" });
        }
      );
    }
  );
});

/* DRIVER - VIEW MY RATINGS */
router.get("/my-ratings", auth, (req, res) => {
  db.query(
    `SELECT r.rating, r.comment, r.created_at,
            s.pickup_address, s.dropoff_address
     FROM ratings r
     JOIN shipments s ON r.shipment_id = s.id
     WHERE r.driver_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});
module.exports = router;
