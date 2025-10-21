import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type ViewMode = "login" | "register" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [psnUsername, setPsnUsername] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setSuccess(undefined);
    setLoading(true);
    
    try {
      if (mode === "login") {
        try {
          await api("/api/auth/login", { 
            method: "POST", 
            body: JSON.stringify({ email, password }) 
          });
          nav("/", { replace: true });
        } catch (e: any) {
          // בדיקה אם זה משתמש ממתין לאישור
          try {
            const errorData = JSON.parse(e.message);
            if (errorData.pendingApproval) {
              setErr("החשבון שלך ממתין לאישור המנהל. תקבל מייל ברגע שהחשבון יאושר.");
            } else if (errorData.rejected) {
              setErr("החשבון שלך נדחה על ידי המנהל. לפרטים נוספים, צור קשר עם המנהל.");
            } else {
              setErr(errorData.error || "שם משתמש או סיסמה שגויים");
            }
          } catch {
            setErr("שם משתמש או סיסמה שגויים");
          }
          setLoading(false);
          return;
        }
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setErr("הסיסמאות אינן תואמות");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErr("הסיסמה חייבת להכיל לפחות 6 תווים");
          setLoading(false);
          return;
        }
        if (!psnUsername || psnUsername.trim().length === 0) {
          setErr("חייב להזין שם משתמש PSN (סוני 5)");
          setLoading(false);
          return;
        }
        try {
          const response = await api("/api/auth/register", { 
            method: "POST", 
            body: JSON.stringify({ email, password, psnUsername: psnUsername.trim() }) 
          });
          
          // בדיקה אם ההרשמה ממתינה לאישור
          if (response.pendingApproval) {
            setSuccess("ההרשמה התקבלה בהצלחה! תקבל מייל ברגע שהמנהל יאשר את חשבונך.");
            setMode("login");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setPsnUsername("");
          } else {
            nav("/", { replace: true });
          }
        } catch (e: any) {
          // טיפול משופר בשגיאות
          try {
            const errorData = JSON.parse(e.message);
            if (errorData.details) {
              setErr(errorData.details);
            } else if (errorData.issues && Array.isArray(errorData.issues)) {
              const messages = errorData.issues.map((i: any) => i.message).join(', ');
              setErr(messages);
            } else if (errorData.error) {
              setErr(errorData.error);
            } else {
              setErr("הרשמה נכשלה");
            }
          } catch {
            setErr(e.message || "הרשמה נכשלה");
          }
          setLoading(false);
          return;
        }
      } else if (mode === "forgot") {
        await api("/api/auth/forgot-password", { 
          method: "POST", 
          body: JSON.stringify({ email }) 
        });
        setSuccess("אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה");
        setEmail("");
      }
    } catch (e: any) {
      try { 
        const j = JSON.parse(e.message); 
        setErr(j.error || "הפעולה נכשלה"); 
      } catch { 
        setErr("הפעולה נכשלה"); 
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode: ViewMode) {
    setMode(newMode);
    setErr(undefined);
    setSuccess(undefined);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPsnUsername("");
  }

  const getTitle = () => {
    if (mode === "login") return "התחברות 🚀";
    if (mode === "register") return "הרשמה";
    return "שחזור סיסמה";
  };

  const getIcon = () => {
    if (mode === "login") return "🔐";
    if (mode === "register") return "✨";
    return "🔑";
  };

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
        onSubmit={submit} 
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
          <div style={{ fontSize: 64, marginBottom: 16 }}>{getIcon()}</div>
          <h2 style={{ 
            margin: 0, 
            fontSize: 28, 
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {getTitle()}
          </h2>
          <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>
            מערכת ניהול טורנירים FC Masters Cup
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: 8, 
          marginBottom: 24,
          background: "#f5f5f5",
          padding: 6,
          borderRadius: 12
        }}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: mode === "login" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
              color: mode === "login" ? "#fff" : "#666",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: mode === "register" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
              color: mode === "register" ? "#fff" : "#666",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            הרשמה
          </button>
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "none",
              background: mode === "forgot" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent",
              color: mode === "forgot" ? "#fff" : "#666",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            שכחתי סיסמה
          </button>
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
              אימייל
            </label>
            <input 
              type="email" 
              placeholder="your@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
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

          {mode !== "forgot" && (
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 700, 
                color: "#333",
                fontSize: 14 
              }}>
                סיסמה
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
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
          )}

          {mode === "register" && (
            <>
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
                  🎮 שם משתמש PSN (סוני 5) *
                </label>
                <input 
                  type="text" 
                  placeholder="שם המשתמש שלך בסוני 5" 
                  value={psnUsername} 
                  onChange={e => setPsnUsername(e.target.value)} 
                  required
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
                <div style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  💡 הזן את שם המשתמש שלך כפי שמופיע ב-PlayStation 5
                </div>
              </div>
            </>
          )}

          {success && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
              color: "#2e7d32",
              borderRadius: 10,
              border: "2px solid #66bb6a",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>✅</span>
              {success}
            </div>
          )}

          {err && (
            <div style={{
              padding: 14,
              background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
              color: "#c62828",
              borderRadius: 10,
              border: "2px solid #ef5350",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>❌</span>
              {err}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%",
              padding: 16,
              background: loading 
                ? "#ccc" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: loading ? "none" : "0 6px 20px rgba(102, 126, 234, 0.4)"
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {loading ? "⏳ אנא המתן..." : (
              mode === "login" ? "🚀 התחבר" : 
              mode === "register" ? "✨ הירשם" : 
              "🔑 שלח קישור לאיפוס"
            )}
          </button>

          {mode === "login" && (
            <div style={{
              textAlign: "center",
              marginTop: 8,
              padding: 16,
              background: "#f5f5f5",
              borderRadius: 10,
              fontSize: 13,
              color: "#666"
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>💡 למנהלים:</div>
              <div>התחברו עם הפרטים שקיבלתם</div>
            </div>
          )}

          {mode === "register" && (
            <div style={{
              textAlign: "center",
              marginTop: 8,
              padding: 16,
              background: "#e3f2fd",
              borderRadius: 10,
              fontSize: 13,
              color: "#1976D2",
              border: "1px solid #2196F3"
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>ℹ️ דרישות הרשמה:</div>
              <div style={{ marginBottom: 4 }}>• הסיסמה חייבת להכיל לפחות 6 תווים</div>
              <div>• חובה להזין שם משתמש PSN (סוני 5)</div>
            </div>
          )}

          {mode === "forgot" && (
            <div style={{
              textAlign: "center",
              marginTop: 8,
              padding: 16,
              background: "#fff3e0",
              borderRadius: 10,
              fontSize: 13,
              color: "#e65100",
              border: "1px solid #ff9800"
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>ℹ️ שים לב:</div>
              <div>קישור לאיפוס הסיסמה יישלח לכתובת המייל (אם קיימת במערכת)</div>
            </div>
          )}

        </div>
      </form>
    </div>
  );
}

