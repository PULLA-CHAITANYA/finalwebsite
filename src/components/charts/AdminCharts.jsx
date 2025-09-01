// client/src/components/charts/AdminCharts.jsx
import { useEffect, useState } from "react";
import api from "../../api";
import StatusPie from "./StatusPie.jsx";
import MonthlyClaimsLine from "./MonthlyClaimsLine.jsx";
import ReimbByDiagnosisBar from "./ReimbByDiagnosisBar.jsx";

export default function AdminCharts() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [statusCounts, setStatusCounts] = useState({ Approved: 0, Rejected: 0, Pending: 0 });
  const [monthly, setMonthly] = useState([]);           // [{ month: '2025-07', claims: 123 }, ...]
  const [reimbByDx, setReimbByDx] = useState([]);       // [{ diagnosis: '...', amount: 1234 }, ...]

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/claims/admin-stats");
        setStatusCounts(data.statusCounts || { Approved: 0, Rejected: 0, Pending: 0 });
        setMonthly(Array.isArray(data.monthly) ? data.monthly : []);
        setReimbByDx(Array.isArray(data.reimbByDiagnosis) ? data.reimbByDiagnosis : []);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card">Loading admin analytics…</div>;
  if (err)     return <div className="card"><div className="error">{err}</div></div>;

  return (
    <div className="grid-cards">
      <StatusPie title="Claim Status" statusCounts={statusCounts} />
      <MonthlyClaimsLine data={monthly} />
      <ReimbByDiagnosisBar title="Reimbursed by Diagnosis (Top 10)" data={reimbByDx} />
    </div>
  );
}
