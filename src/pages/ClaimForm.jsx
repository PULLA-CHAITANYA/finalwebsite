import Papa from "papaparse";
import { useState } from "react";
import api from "../lib/api";

const CHRONIC_FIELDS = [
  "ChronicCond_Alzheimer",
  "ChronicCond_Heartfailure",
  "ChronicCond_KidneyDisease",
  "ChronicCond_Cancer",
  "ChronicCond_ObstrPulmonary",
  "ChronicCond_Depression",
  "ChronicCond_Diabetes",
  "ChronicCond_IschemicHeart",
  "ChronicCond_Osteoporasis",
  "ChronicCond_rheumatoidarthritis",
  "ChronicCond_stroke",
];

const DATE_FIELDS = ["ClaimStartDt", "ClaimEndDt", "DOB", "AdmissionDt"];

function normalize(doc) {
  const d = { ...doc };
  for (const k in d) {
    if (typeof d[k] === "string") d[k] = d[k].trim();
    if (d[k] === "") d[k] = null;
  }
  CHRONIC_FIELDS.forEach((k) => {
    const val = String(d[k]).trim();
    if (val.includes('Yes')) d[k] = 1;
    else if (val.includes('No')) d[k] = 2;
    else d[k] = null;
  });
  if (d.Gender) {
    const g = String(d.Gender);
    if (g.includes('Male') || g.includes('M')) d.Gender = 1;
    else if (g.includes('Female') || g.includes('F')) d.Gender = 2;
  }
  if (d.InscClaimAmtReimbursed != null) {
    const n = Number(d.InscClaimAmtReimbursed);
    if (!Number.isNaN(n)) d.InscClaimAmtReimbursed = n;
  }
  return d;
}

export default function ClaimForm() {
  const [tab, setTab] = useState("single");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [beneficiary, setBeneficiary] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({
    ClaimID: "",
    BeneID: "",
    DiagnosisGroupCode: "",
    Gender: "",
    InscClaimAmtReimbursed: "",
    ClaimStartDt: "",
    ClaimEndDt: "",
    DOB: "",
    AdmissionDt: "",
    ...Object.fromEntries(CHRONIC_FIELDS.map((k) => [k, ""])),
  });

  const [csvRows, setCsvRows] = useState([]);
  const [csvInfo, setCsvInfo] = useState({ rows: 0, filename: "" });

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  function validateClient(d) {
    const miss = [];
    if (!d.ClaimID) miss.push("ClaimID");
    if (!d.BeneID) miss.push("BeneID");
    return miss.length ? `Missing required: ${miss.join(", ")}` : null;
  }

  async function submitSingle(e) {
    e.preventDefault();
    setMsg("");
    const payload = normalize(form);
    const err = validateClient(payload);
    if (err) return setMsg(`❌ ${err}`);
    setBusy(true);
    try {
      await api.post("/claims/submit", payload);
      setMsg(`✅ Submitted claim ${payload.ClaimID}`);
      setForm((s) => ({
        ...s,
        ClaimID: "",
        BeneID: "",
        InscClaimAmtReimbursed: "",
        DiagnosisGroupCode: "",
      }));
      setBeneficiary(null);
      setConfirmed(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) {
      setMsg(`❌ ${e2?.response?.data?.error || e2.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleCsv(file) {
    if (!file) return;
    setMsg("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => {
        const rows = (res.data || []).map(normalize);
        setCsvRows(rows);
        setCsvInfo({ rows: rows.length, filename: file.name });
        if (!rows.length) setMsg("❌ CSV had no rows.");
      },
      error: (err) => setMsg(`❌ CSV error: ${err.message}`),
    });
  }

  async function submitCsv() {
    if (!csvRows.length) return setMsg("❌ No CSV rows parsed.");
    setBusy(true);
    setMsg("");
    try {
      const size = 1000;
      let inserted = 0;
      for (let i = 0; i < csvRows.length; i += size) {
        const chunk = csvRows.slice(i, i + size);
        const { data } = await api.post("/claims/submit-bulk", {
          items: chunk,
        });
        inserted += data?.inserted || 0;
      }
      setMsg(`✅ Bulk inserted ${inserted} documents`);
      setCsvRows([]);
      setCsvInfo({ rows: 0, filename: "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsg(`❌ ${e?.response?.data?.error || e.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Prefix handling for ClaimID and BeneID
  const handleClaimId = (e) => {
    const num = e.target.value.replace(/\D/g, "");
    setForm((s) => ({ ...s, ClaimID: "CLM" + num }));
  };

  // Beneficiary lookup and autofill
  const handleBeneIdChange = async (e) => {
    const num = e.target.value.replace(/\D/g, "");
    const beneId = "BENE" + num;
    setForm((s) => ({ ...s, BeneID: beneId }));
    
    if (num.length >= 5) {
      try {
        setBusy(true);
        const { data } = await api.get(`/beneficiary/${beneId}`);
        if (data) {
          setBeneficiary(data);
          // Autofill form with beneficiary data
          setForm(prev => ({
            ...prev,
            DOB: data.DOB || "",
            Gender: data.Gender === 1 ? "Male (M)" : data.Gender === 2 ? "Female (F)" : "",
            ...Object.fromEntries(
              CHRONIC_FIELDS.map(field => [field, data[field] === 1 ? "Yes" : data[field] === 2 ? "No" : ""])
            )
          }));
        }
      } catch (error) {
        console.error("Error fetching beneficiary:", error);
        setBeneficiary(null);
      } finally {
        setBusy(false);
      }
    } else {
      setBeneficiary(null);
    }
  };

  const handleBeneId = async (e) => {
    const num = e.target.value.replace(/\D/g, "");
    const beneId = "BENE" + num;
    setForm((s) => ({ ...s, BeneID: beneId }));

    if (num.length > 0) {
      try {
        const res = await api.get(`/beneficiary/${beneId}`);
        if (res.data.found) {
          const bene = res.data.data;

          // Auto-fill form fields directly
          setForm((s) => ({
            ...s,
            BeneID: bene.BeneID,
            DOB: bene.DOB || s.DOB,
            Gender: bene.Gender === 1 ? "M" : bene.Gender === 2 ? "F" : s.Gender,
            ...Object.fromEntries(
              CHRONIC_FIELDS.map((k) => [k, bene[k] ?? s[k]])
            ),
          }));
          
          // Optional: Show a subtle success message
          setMsg("✅ Beneficiary details loaded");
          setTimeout(() => setMsg(""), 2000); // Clear after 2 seconds
        }
      } catch (err) {
        console.error("Beneficiary lookup failed:", err);
        setMsg("❌ Beneficiary lookup failed");
        setTimeout(() => setMsg(""), 2000);
      }
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="title">Submit Claims</h2>
          <div className="muted">Single claim or CSV bulk upload.</div>
        </div>
        <div className="btn-group">
          <button
            className={`btn ${tab === "single" ? "" : "btn-ghost"}`}
            onClick={() => setTab("single")}
          >
            Single
          </button>
          <button
            className={`btn ${tab === "csv" ? "" : "btn-ghost"}`}
            onClick={() => setTab("csv")}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="panel-lg">
        {tab === "single" ? (
          <form onSubmit={submitSingle}>
            {/* BASICS */}
            <div className="section">
              <div className="section-head">
                <h4>Basics</h4>
                <p className="muted small">
                  Required fields are marked with *
                </p>
              </div>
              <div className="grid-2">
                {/* Claim ID */}
                <div className="field">
                  <label>
                    ClaimID <span className="req">*</span>
                  </label>
                  <div className="control prefix-wrapper">
                    <span className="prefix-text">CLM</span>
                    <input
                      className="prefix-input"
                      name="ClaimID"
                      value={form.ClaimID.replace("CLM", "")}
                      onChange={handleClaimId}
                      placeholder="0001"
                    />
                  </div>
                </div>

                {/* Bene ID */}
                <div className="field">
                  <label>
                    BeneID <span className="req">*</span>
                  </label>
                  <div className="control prefix-wrapper">
                    <span className="prefix-text">BENE</span>
                    <input
                      className="prefix-input"
                      name="BeneID"
                      value={form.BeneID.replace("BENE", "")}
                      onChange={handleBeneId}
                      placeholder="11001"
                    />
                  </div>
                </div>

                {/* DiagnosisGroupCode */}
                <div className="field">
                  <label>DiagnosisGroupCode</label>
                  <div className="control prefix-wrapper">
                    <span className="prefix-text">DG</span>
                    <input
                      className="prefix-input"
                      name="DiagnosisGroupCode"
                      value={form.DiagnosisGroupCode || ""}
                      onChange={onChange}
                      placeholder="e.g. D077"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="field">
                  <label>Gender</label>
                  <div className="control prefix-wrapper">
                    <select
                      className="prefix-input"
                      name="Gender"
                      value={form.Gender || ""}
                      onChange={onChange}
                    >
                      <option value="">— Select —</option>
                      <option value="M">Male (M)</option>
                      <option value="F">Female (F)</option>
                    </select>
                  </div>
                </div>

                {/* InscClaimAmtReimbursed */}
                <div className="field">
                  <label>InscClaimAmtReimbursed</label>
                  <div className="control prefix-wrapper">
                    <span className="prefix-text">$</span>
                    <input
                      type="number"
                      className="prefix-input"
                      name="InscClaimAmtReimbursed"
                      value={form.InscClaimAmtReimbursed || ""}
                      onChange={onChange}
                      placeholder="e.g. 12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DATES */}
            <div className="section">
              <div className="section-head">
                <h4>Dates</h4>
              </div>
              <div className="grid-2">
                {DATE_FIELDS.map((k) => (
                  <div key={k} className="field">
                    <label>{k}</label>
                    <div className="control prefix-wrapper">
                      <span className="prefix-text">📅</span>
                      <input
                        type="date"
                        className="prefix-input"
                        name={k}
                        value={form[k] || ""}
                        onChange={onChange}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHRONIC */}
            <div className="section">
              <div className="section-head">
                <h4>Chronic Conditions</h4>
              </div>
              <div className="grid-2">
                {CHRONIC_FIELDS.map((k) => (
                  <div key={k} className="field">
                    <label>{k}</label>
                    <div className="control">
                      <select
                        className="prefix-input"
                        name={k}
                        value={form[k] || ""}
                        onChange={onChange}
                      >
                        <option value="">— Select —</option>
                        <option value="1">Yes (1)</option>
                        <option value="0">No (0)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="footer-bar no-sticky">
              <div className="muted small">
                Provider is set server-side. <b>Required:</b> ClaimID, BeneID.
              </div>
              <button className="btn btn-primary" disabled={busy}>
                Submit
              </button>
            </div>
          </form>
        ) : (
          <div className="section">
            <div className="section-head">
              <h4>CSV Upload</h4>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleCsv(e.target.files?.[0])}
            />
            <div className="hint" style={{ marginTop: 6 }}>
              CSV headers: ClaimID,BeneID,ClaimStartDt,ClaimEndDt,DOB,AdmissionDt,InscClaimAmtReimbursed,DiagnosisGroupCode,Gender,ChronicCond_*
            </div>
            {csvInfo.rows > 0 && (
              <div className="pill pill-info" style={{ marginTop: 10 }}>
                {csvInfo.filename} • {csvInfo.rows} rows parsed
              </div>
            )}
            <div className="footer-bar no-sticky" style={{ marginTop: 16 }}>
              <div />
              <button
                className="btn btn-primary"
                disabled={busy || !csvRows.length}
                onClick={submitCsv}
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div
          style={{ marginTop: 12 }}
          className={
            msg.startsWith("✅") ? "pill pill-good" : "pill pill-danger"
          }
        >
          {msg}
        </div>
      )}
    </div>
  );
}
