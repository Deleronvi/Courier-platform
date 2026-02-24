const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.role !== "admin") return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* DASHBOARD STATS */
router.get("/stats", adminAuth, (req, res) => {

  const stats = {};

  db.query("SELECT COUNT(*) total FROM users", (e, r1) => {
  if (e) return res.status(500).json({ error: e.message });
  stats.users = r1[0].total;

    db.query("SELECT COUNT(*) total FROM users WHERE role='courier'", (e2, r2) => {
      stats.couriers = r2[0].total;

      db.query("SELECT COUNT(*) total FROM shipments", (e3, r3) => {
        stats.shipments = r3[0].total;

        db.query("SELECT COUNT(*) total FROM shipments WHERE status='delivered'", (e4, r4) => {
          stats.delivered = r4[0].total;

          db.query("SELECT COUNT(*) total FROM shipments WHERE status='pending'", (e5, r5) => {
            stats.pending = r5[0].total;

            db.query("SELECT COUNT(*) total FROM shipments WHERE status='cancelled'", (e6, r6) => {
              stats.cancelled = r6[0].total;

              res.json(stats);
            });
          });
        });
      });
    });
  });
});



/* ALL USERS */
router.get("/users", adminAuth, (req, res) => {
  db.query(
    "SELECT id, email, role FROM users ORDER BY id DESC",
    (err, rows) => res.json(rows)
  );
});


/* UPDATE USER ROLE */
router.put("/users/:id/role", adminAuth, (req, res) => {
  const { role } = req.body;
  db.query(
    "UPDATE users SET role=? WHERE id=?",
    [role, req.params.id],
    () => res.sendStatus(200)
  );
});

/* ENABLE / DISABLE USER */
router.put("/users/:id/status", adminAuth, (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE users SET status=? WHERE id=?",
    [status, req.params.id],
    () => res.sendStatus(200)
  );
});

/* REPORTS */
router.get("/reports", adminAuth, (req, res) => {

  const report = {};

  db.query(
    "SELECT status, COUNT(*) count FROM shipments GROUP BY status",
    (e, r1) => {

      report.byStatus = r1;

      db.query(
        "SELECT DATE(created_at) day, COUNT(*) count FROM shipments GROUP BY day ORDER BY day",
        (e2, r2) => {

          report.byDay = r2;

          db.query(
            "SELECT COUNT(*) total FROM shipments",
            (e3, r3) => {

              const total = r3[0].total;

              const delivered = r1.find(r => r.status === "delivered")?.count || 0;
              const cancelled = r1.find(r => r.status === "cancelled")?.count || 0;

              report.total = total;
              report.successRate = total ? ((delivered / total) * 100).toFixed(1) : 0;
              report.cancelRate = total ? ((cancelled / total) * 100).toFixed(1) : 0;

              db.query(
                `SELECT u.email, COUNT(*) deliveries
                 FROM shipments s
                 JOIN users u ON s.courier_id = u.id
                 WHERE s.status='delivered'
                 GROUP BY u.id
                 ORDER BY deliveries DESC
                 LIMIT 1`,
                (e4, r4) => {

                  report.topDriver = r4[0] || null;

                  res.json(report);
                }
              );
            }
          );
        }
      );
    }
  );
});

/* GET ALL SHIPMENTS */
router.get("/shipments", adminAuth, (req, res) => {
  const q = `
    SELECT 
      s.*,
      sender.email AS sender_email,
      courier.email AS courier_email
    FROM shipments s
    JOIN users sender ON s.sender_id = sender.id
    LEFT JOIN users courier ON s.courier_id = courier.id
    ORDER BY s.created_at DESC
  `;
  db.query(q, (err, rows) => res.json(rows));
});


/* FORCE CANCEL SHIPMENT */
router.put("/shipments/:id/cancel", adminAuth, (req, res) => {
  db.query(
    "UPDATE shipments SET status='cancelled' WHERE id=?",
    [req.params.id],
    () => res.sendStatus(200)
  );
});

/* FORCE DELIVER */
router.put("/shipments/:id/deliver", adminAuth, (req, res) => {
  db.query(
    "UPDATE shipments SET status='delivered' WHERE id=?",
    [req.params.id],
    () => res.sendStatus(200)
  );
});

/* DRIVER PERFORMANCE */
router.get("/drivers", adminAuth, (req, res) => {
  const q = `
    SELECT 
      u.id,
      u.email,
      u.status,
      u.is_online,
      COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) AS deliveries,
      COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) AS cancelled
    FROM users u
    LEFT JOIN shipments s ON u.id = s.courier_id
    WHERE u.role = 'courier'
    GROUP BY u.id
    ORDER BY u.id DESC
  `;

  db.query(q, (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err });
    }
    res.json(rows);
  });
});

module.exports = router;
