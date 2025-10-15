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
          throw e; // נזרוק את השגיאה הלאה לטיפול הכללי
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
    if (mode === "login") return "התחברות";
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

          {/* Google OAuth - only show in login and register modes */}
          {mode !== "forgot" && (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "24px 0 16px 0"
              }}>
                <div style={{ flex: 1, height: 1, background: "#e0e0e0" }}></div>
                <span style={{ fontSize: 13, color: "#999", fontWeight: 600 }}>או</span>
                <div style={{ flex: 1, height: 1, background: "#e0e0e0" }}></div>
              </div>

              <a
                href="/api/auth/google"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  width: "100%",
                  padding: 14,
                  background: "#fff",
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#333",
                  textDecoration: "none",
                  transition: "all 0.3s",
                  cursor: "pointer"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#4285f4";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e0e0e0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                {mode === "login" ? "התחבר באמצעות Google" : "הירשם באמצעות Google"}
              </a>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

