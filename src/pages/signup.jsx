import { useEffect, useRef, useState } from "react";
import api from "../api";

export default function Signup() {
  const [role, setRole] = useState("provider");
  const [providerId, setProviderId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const pwMatch = password === confirmPassword && password.length >= 6;
  const canSubmit =
    emailValid &&
    pwMatch &&
    (!role || role === "admin" || (role === "provider" && (providerId?.trim()?.length ?? 0) > 0)) &&
    !loading;

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setStatus(null);

    if (!emailValid) {
      setMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    if (!pwMatch) {
      setMsg("Passwords must match and be at least 6 characters.");
      setStatus("error");
      return;
    }

    try {
      setLoading(true);
      const body = {
        email: email.trim(),
        password,
        role,
        ...(role === "provider" ? { providerId: providerId?.trim() || "P001" } : {}),
      };
      await api.post("/auth/signup", body);

      setStatus("success");
      setMsg("Account created! Redirecting to login…");
      setTimeout(() => (window.location.href = "/login"), 900);
    } catch (err) {
      setStatus("error");
      setMsg(err?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container" role="region" aria-label="Signup form">
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">🆕</div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join the Claims Portal to get started</p>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate>
          {/* Role */}
          <div className="field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ height: 44, borderRadius: 10, background: "#0f1624", color: "var(--text)", border: "1px solid #223047", padding: "0 10px" }}
            >
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Provider ID (conditional) */}
          {role === "provider" && (
            <div className="field">
              <label htmlFor="providerId">Provider ID</label>
              <input
                id="providerId"
                placeholder="Enter Provider ID (e.g., PRV00 01)"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={!emailValid}
            />
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="confirmPassword"
                type={showPwd2 ? "text" : "password"}
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                aria-invalid={!pwMatch}
              />
              <button
                type="button"
                onClick={() => setShowPwd2((s) => !s)}
                aria-label={showPwd2 ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {showPwd2 ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="auth-submit" disabled={!canSubmit}>
            {loading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>&nbsp;Creating account…
              </>
            ) : (
              <>Create account</>
            )}
          </button>

          {msg && (
            <div className={`auth-message ${status === "success" ? "success" : "error"}`} role="status">
              {msg}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <a href="/login" className="auth-link">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
