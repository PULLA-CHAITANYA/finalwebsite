import { useEffect, useState } from "react";
import api from "../api";

// recharts
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ProviderDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/claims/provider-stats");
      setStats(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    }
  };

  // ---------- Prepare Chart Data ----------
  const statusData = stats?.typeCounts
    ? Object.entries(stats.typeCounts).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const reimbData = stats?.recent
    ? stats.recent.map((c) => ({
        Dx: c.DiagnosisGroupCode || "Unknown",
        Amount: c.InscClaimAmtReimbursed || 0,
      }))
    : [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // ---------- Status pill style ----------
  const getStatusClass = (status) => {
    if (status === "Approved") return "pill pill-success";
    if (status === "Rejected") return "pill pill-danger";
    return "pill pill-warning"; // Pending / default
  };

  return (
    <div className="page">
      <div className="between" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="title">Provider Dashboard</h2>
          <p className="muted">
            Overview of your submitted claims and current statuses.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchStats}>
          Refresh
        </button>
      </div>

      {err && (
        <div style={{ marginTop: 10 }} className="pill pill-danger">
          {err}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid-cards" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Total reimbursed</span>
            <span className="stat-value">{stats?.totalReimbursed ?? 0}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Average reimbursed</span>
            <span className="stat-value">{stats?.avgReimbursed ?? 0}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Pending</span>
            <span className="stat-value">
              {stats?.typeCounts?.Pending ?? 0}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label">Approved</span>
            <span className="stat-value">
              {stats?.statusCounts?.Approved ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div className="card">
          <h4>Status Distribution</h4>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">No status data available</p>
          )}
        </div>

        <div className="card">
          <h4>Reimbursed by Diagnosis</h4>
          {reimbData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reimbData}>
                <XAxis dataKey="Dx" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">No reimbursement data available</p>
          )}
        </div>
      </div>

      {/* Recent claims table */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="between" style={{ marginBottom: 8 }}>
          <h4>Recent Claims</h4>
          <a className="btn" href="/submit">
            Submit New Claim
          </a>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ClaimID</th>
                <th>Start</th>
                <th className="num">Amount</th>
                <th>Dx</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent || []).map((r) => (
                <tr key={r.ClaimID}>
                  <td className="mono">{r.ClaimID}</td>
                  <td>
                    {r.ClaimStartDt
                      ? new Date(r.ClaimStartDt).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="num">{r.InscClaimAmtReimbursed ?? ""}</td>
                  <td>{r.DiagnosisGroupCode ?? ""}</td>
                  <td>
                    <span className={getStatusClass(r.status)}>
                      {r.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.recent || !stats.recent.length) && (
                <tr>
                  <td colSpan={5} className="muted pad-lg">
                    No recent claims.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
