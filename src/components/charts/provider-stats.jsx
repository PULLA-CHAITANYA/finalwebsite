import express from "express";
import db from "../db.js"; // your DB connector

const router = express.Router();

// ------------------
// Provider Stats API
// ------------------
router.get("/provider-stats", async (req, res) => {
  try {
    const providerId = req.user?.id; // assuming JWT middleware attaches user

    // 🔹 Total reimbursed
    const totalResult = await db.query(
      `SELECT COALESCE(SUM("InscClaimAmtReimbursed"),0) AS total
       FROM claims WHERE provider_id = $1`,
      [providerId]
    );

    // 🔹 Average reimbursed
    const avgResult = await db.query(
      `SELECT COALESCE(AVG("InscClaimAmtReimbursed"),0) AS avg
       FROM claims WHERE provider_id = $1`,
      [providerId]
    );

    // 🔹 Status counts
    const statusResult = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM claims WHERE provider_id = $1
       GROUP BY status`,
      [providerId]
    );

    const statusCounts = {};
    statusResult.rows.forEach((r) => {
      statusCounts[r.status] = Number(r.count);
    });

    // 🔹 Recent claims (last 5)
    const recentResult = await db.query(
      `SELECT "ClaimID", "ClaimStartDt", "InscClaimAmtReimbursed",
              "DiagnosisGroupCode", status
       FROM claims
       WHERE provider_id = $1
       ORDER BY "ClaimStartDt" DESC
       LIMIT 5`,
      [providerId]
    );

    res.json({
      totalReimbursed: Number(totalResult.rows[0].total),
      avgReimbursed: Number(avgResult.rows[0].avg),
      statusCounts,
      recent: recentResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch provider stats" });
  }
});

export default router;
