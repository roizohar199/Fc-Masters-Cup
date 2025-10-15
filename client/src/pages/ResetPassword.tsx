import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "טוקן לא תקף. אנא בקש איפוס סיסמה חדש." });
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!token) {
      setMessage({ type: "error", text: "טוקן חסר" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "הסיסמה חייבת להכיל לפחות 6 תווים" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "הסיסמאות אינן תואמות" });
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword })
      });

      setMessage({ 
        type: "success", 
        text: "הסיסמה אופסה בהצלחה! מעביר לדף התחברות..." 
      });

      setTimeout(() => {
        nav("/login");
      }, 2000);
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error?.message || "שגיאה באיפוס הסיסמה. ייתכן שהטוקן פג תוקף." 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      direction: "rtl",
      padding: 20
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{
          width: "100%",
          maxWidth: 450,
          background: "#fff",
          borderRadius: 20,
          padding: 40,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔑</div>
          <h2 style={{ 
            margin: 0, 
            fontSize: 28, 
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            איפוס סיסמה
          </h2>
          <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>
            הזן סיסמה חדשה לחשבון שלך
          </p>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 8, 
              fontWeight: 700, 
              color: "#333",
              fontSize: 14 
            }}>
              סיסמה חדשה
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required
              disabled={!token || loading}
              style={{
                width: "100%",
                padding: 14,
                border: "2px solid #e0e0e0",
                borderRadius: 10,
                fontSize: 15,
                transition: "all 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#667eea"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 8, 
              fontWeight: 700, 
              color: "#333",
              fontSize: 14 
            }}>
              אימות סיסמה
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required
              disabled={!token || loading}
              style={{
                width: "100%",
                padding: 14,
                border: "2px solid #e0e0e0",
                borderRadius: 10,
                fontSize: 15,
                transition: "all 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#667eea"}
              onBlur={e => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>

          {message && (
            <div style={{
              padding: 14,
              background: message.type === "success" 
                ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)"
                : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
              color: message.type === "success" ? "#2e7d32" : "#c62828",
              borderRadius: 10,
              border: `2px solid ${message.type === "success" ? "#66bb6a" : "#ef5350"}`,
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>{message.type === "success" ? "✅" : "❌"}</span>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !token}
            style={{
              width: "100%",
              padding: 16,
              background: (loading || !token)
                ? "#ccc" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              cursor: (loading || !token) ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: (loading || !token) ? "none" : "0 6px 20px rgba(102, 126, 234, 0.4)"
            }}
            onMouseEnter={e => !loading && token && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {loading ? "⏳ מאפס סיסמה..." : "🔄 אפס סיסמה"}
          </button>

          <div style={{
            textAlign: "center",
            marginTop: 8,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 10,
            fontSize: 13,
            color: "#666"
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 זוכר את הסיסמה?</div>
            <a 
              href="/login" 
              style={{ 
                color: "#667eea", 
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              חזור להתחברות
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

