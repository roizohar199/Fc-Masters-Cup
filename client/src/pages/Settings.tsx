import React, { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [psnUsername, setPsnUsername] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [psnMessage, setPsnMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [psnLoading, setPsnLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const nav = useNavigate();

  // טעינת פרטי המשתמש
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await api("/api/user/profile");
        setPsnUsername(profile.psnUsername || "");
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleUpdatePSN(e: React.FormEvent) {
    e.preventDefault();
    setPsnMessage(null);

    if (psnUsername.length < 3) {
      setPsnMessage({ type: "error", text: "שם משתמש PSN חייב להכיל לפחות 3 תווים" });
      return;
    }

    setPsnLoading(true);
    try {
      await api("/api/user/update-psn", {
        method: "POST",
        body: JSON.stringify({ psnUsername })
      });
      
      setPsnMessage({ type: "success", text: "שם המשתמש PSN עודכן בהצלחה!" });
    } catch (error: any) {
      setPsnMessage({ 
        type: "error", 
        text: error?.message || "שגיאה בעדכון שם המשתמש PSN" 
      });
    } finally {
      setPsnLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "הסיסמה חדשה חייבת להכיל לפחות 6 תווים" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "הסיסמאות אינן תואמות" });
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      setMessage({ type: "success", text: "הסיסמה שונתה בהצלחה! מתנתק..." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // התנתקות אחרי 2 שניות
      setTimeout(async () => {
        await api("/api/auth/logout", { method: "POST" });
        nav("/login");
      }, 2000);
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error?.message || "שגיאה בשינוי הסיסמה. ודא שהסיסמה הנוכחית נכונה." 
      });
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#667eea" }}>טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }}>
      <div style={{
        maxWidth: 500,
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 40,
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#333", margin: 0 }}>
            הגדרות חשבון
          </h1>
          <p style={{ fontSize: 15, color: "#666", marginTop: 8 }}>
            עדכון פרטים אישיים
          </p>
        </div>

        {/* PSN Username Form */}
        <form onSubmit={handleUpdatePSN} style={{ display: "grid", gap: 20, marginBottom: 40, paddingBottom: 40, borderBottom: "2px solid #e0e0e0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: 0, textAlign: "right" }}>
            🎮 שם משתמש PSN
          </h2>
          
          <div>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              marginBottom: 8,
              textAlign: "right"
            }}>
              שם המשתמש שלך ב-PlayStation Network
            </label>
            <input
              type="text"
              value={psnUsername}
              onChange={e => setPsnUsername(e.target.value)}
              placeholder="לדוגמה: PlayerOne123"
              required
              minLength={3}
              maxLength={50}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "all 0.3s",
                boxSizing: "border-box",
                textAlign: "left",
                direction: "ltr"
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
            <p style={{ fontSize: 12, color: "#666", marginTop: 8, textAlign: "right" }}>
              שם זה ישמש לזיהוי שלך במשחקים
            </p>
          </div>

          {psnMessage && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              backgroundColor: psnMessage.type === "success" ? "#e8f5e9" : "#ffebee",
              border: `2px solid ${psnMessage.type === "success" ? "#4caf50" : "#f44336"}`,
              textAlign: "center"
            }}>
              <p style={{
                margin: 0,
                color: psnMessage.type === "success" ? "#2e7d32" : "#c62828",
                fontSize: 15,
                fontWeight: 600
              }}>
                {psnMessage.text}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={psnLoading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "none",
              background: psnLoading 
                ? "#ccc" 
                : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: psnLoading ? "not-allowed" : "pointer",
              boxShadow: psnLoading ? "none" : "0 4px 15px rgba(67, 233, 123, 0.4)",
              transition: "all 0.3s"
            }}
          >
            {psnLoading ? "מעדכן..." : "עדכן שם משתמש PSN"}
          </button>
        </form>

        {/* Telegram Group Button */}
        <div style={{ 
          display: "grid", 
          gap: 20, 
          marginBottom: 40, 
          paddingBottom: 40, 
          borderBottom: "2px solid #e0e0e0" 
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: 0, textAlign: "right" }}>
            📱 קבוצת טלגרם
          </h2>
          
          <div style={{ textAlign: "center" }}>
            <p style={{ 
              fontSize: 15, 
              color: "#666", 
              marginBottom: 20, 
              lineHeight: 1.5,
              textAlign: "right"
            }}>
              הצטרף לקבוצת הטלגרם שלנו לקבלת עדכונים, הודעות חשובות וקשר עם שחקנים אחרים
            </p>
            
            <a
              href="https://t.me/+elbxvwU9fLE1YTg8"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                width: "100%",
                padding: "16px 24px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #0088cc 0%, #00a8ff 100%)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 136, 204, 0.4)",
                transition: "all 0.3s",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 136, 204, 0.6)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 136, 204, 0.4)";
              }}
            >
              <span style={{ fontSize: 20 }}>📱</span>
              הצטרף לקבוצת טלגרם
            </a>
          </div>
        </div>

        {/* Password Change Form */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#333", margin: "0 0 20px 0", textAlign: "right" }}>
          🔒 שינוי סיסמה
        </h2>

        <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              marginBottom: 8,
              textAlign: "right"
            }}>
              סיסמה נוכחית
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "all 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              marginBottom: 8,
              textAlign: "right"
            }}>
              סיסמה חדשה
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "all 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#333",
              marginBottom: 8,
              textAlign: "right"
            }}>
              אימות סיסמה חדשה
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                transition: "all 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={e => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
          </div>

          {message && (
            <div style={{
              padding: 16,
              borderRadius: 10,
              backgroundColor: message.type === "success" ? "#e8f5e9" : "#ffebee",
              border: `2px solid ${message.type === "success" ? "#4caf50" : "#f44336"}`,
              textAlign: "center"
            }}>
              <p style={{
                margin: 0,
                color: message.type === "success" ? "#2e7d32" : "#c62828",
                fontSize: 15,
                fontWeight: 600
              }}>
                {message.text}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "none",
              background: loading 
                ? "#ccc" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 15px rgba(102, 126, 234, 0.4)",
              transition: "all 0.3s"
            }}
          >
            {loading ? "משנה סיסמה..." : "שנה סיסמה"}
          </button>

          <button
            type="button"
            onClick={() => nav("/")}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              border: "2px solid #e0e0e0",
              background: "#fff",
              color: "#666",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.color = "#667eea";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#e0e0e0";
              e.currentTarget.style.color = "#666";
            }}
          >
            חזור לדף הבית
          </button>
        </form>
      </div>
    </div>
  );
}

