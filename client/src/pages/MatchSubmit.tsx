import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Uploader from "../components/Uploader";

export default function MatchSubmit() {
  const { matchId } = useParams<{ matchId: string }>();
  const [token, setToken] = useState("");
  const [reporterPsn, setReporterPsn] = useState("");
  const [scoreHome, setScoreHome] = useState<number>(0);
  const [scoreAway, setScoreAway] = useState<number>(0);
  const [pin, setPin] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!matchId) {
      setError("Match ID חסר");
      return;
    }

    if (!token.trim()) {
      setError("יש להזין את ה-Token");
      return;
    }

    if (!reporterPsn.trim()) {
      setError("יש להזין את שם המשתמש PSN");
      return;
    }

    if (!pin.trim() || pin.length !== 6) {
      setError("יש להזין PIN בן 6 תווים");
      return;
    }

    if (!file) {
      setError("חובה להעלות וידאו של המחצית השנייה! ללא הוכחה תודח מהמשחק ללא החזר כספי!");
      return;
    }
    
    // בדיקה שהקובץ הוא וידאו או תמונה
    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      setError("יש להעלות קובץ וידאו (MP4, MOV, AVI) או תמונה בלבד");
      return;
    }
    
    // בדיקת גודל קובץ (מקסימום 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      setError("גודל הקובץ חורג מ-500MB. אנא הקטן את הקובץ ונסה שנית.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("reporterPsn", reporterPsn);
      fd.append("scoreHome", String(scoreHome));
      fd.append("scoreAway", String(scoreAway));
      fd.append("pin", pin);
      fd.append("evidence", file);

      const res = await fetch(`/api/matches/${matchId}/submit`, {
        credentials: "include",
        method: "POST",
        headers: { "x-match-token": token },
        body: fd
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "שגיאה בהגשת התוצאה");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: 24,
      direction: "rtl",
      textAlign: "right",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        maxWidth: 600,
        width: "100%",
        background: "#fff",
        borderRadius: 20,
        padding: 32,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: 24
        }}>
          <div style={{
            fontSize: 64,
            marginBottom: 16
          }}>⚽</div>
          <h1 style={{
            margin: "0 0 8px 0",
            fontSize: 32,
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            הגשת תוצאת משחק
          </h1>
          
          <div style={{
            fontSize: 14,
            color: "#666",
            marginTop: 16,
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 10,
            display: "inline-block"
          }}>
            Match ID: <code style={{ 
              backgroundColor: "#fff", 
              padding: "4px 10px", 
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              marginRight: 8,
              border: "1px solid #ddd"
            }}>{matchId}</code>
          </div>
        </div>

        {!result && (
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 700,
                color: "#333",
                fontSize: 15
              }}>
                Token פרטי <span style={{ color: "#f44336" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="הזן את ה-Token שקיבלת"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "2px solid #e0e0e0",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "monospace",
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
                fontSize: 15
              }}>
                שם משתמש PSN <span style={{ color: "#f44336" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="הזן את שם המשתמש שלך ב-PSN"
                value={reporterPsn}
                onChange={e => setReporterPsn(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "2px solid #e0e0e0",
                  borderRadius: 10,
                  fontSize: 14,
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
                fontSize: 15
              }}>
                תוצאת המשחק <span style={{ color: "#f44336" }}>*</span>
              </label>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
                alignItems: "center"
              }}>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={scoreHome}
                    onChange={e => setScoreHome(Number(e.target.value))}
                    placeholder="בית"
                    style={{
                      width: "100%",
                      padding: 16,
                      border: "2px solid #e0e0e0",
                      borderRadius: 10,
                      fontSize: 24,
                      textAlign: "center",
                      fontWeight: 800,
                      transition: "all 0.3s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#667eea"}
                    onBlur={e => e.target.style.borderColor = "#e0e0e0"}
                  />
                  <div style={{ textAlign: "center", marginTop: 4, fontSize: 12, color: "#666" }}>
                    בית
                  </div>
                </div>
                <span style={{ 
                  fontSize: 32, 
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>:</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={scoreAway}
                    onChange={e => setScoreAway(Number(e.target.value))}
                    placeholder="חוץ"
                    style={{
                      width: "100%",
                      padding: 16,
                      border: "2px solid #e0e0e0",
                      borderRadius: 10,
                      fontSize: 24,
                      textAlign: "center",
                      fontWeight: 800,
                      transition: "all 0.3s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#667eea"}
                    onBlur={e => e.target.style.borderColor = "#e0e0e0"}
                  />
                  <div style={{ textAlign: "center", marginTop: 4, fontSize: 12, color: "#666" }}>
                    חוץ
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 8, 
                fontWeight: 700,
                color: "#333",
                fontSize: 15
              }}>
                PIN (6 תווים) <span style={{ color: "#f44336" }}>*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="הזן את ה-PIN שהוצג בתחילת המשחק"
                value={pin}
                onChange={e => setPin(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "2px solid #e0e0e0",
                  borderRadius: 10,
                  fontSize: 20,
                  fontFamily: "monospace",
                  letterSpacing: 6,
                  textAlign: "center",
                  fontWeight: 800,
                  transition: "all 0.3s"
                }}
                onFocus={e => e.target.style.borderColor = "#667eea"}
                onBlur={e => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            <div style={{
              background: "#fff3e0",
              padding: 16,
              borderRadius: 12,
              border: "3px solid #ff9800",
              marginBottom: 8
            }}>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#e65100",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                חובה להעלות וידאו!
              </div>
              <ul style={{
                fontSize: 14,
                color: "#5d4037",
                margin: 0,
                paddingRight: 20,
                lineHeight: 1.6
              }}>
                <li>יש להעלות וידאו של <strong>המחצית השנייה</strong> של המשחק</li>
                <li>הוידאו חייב להיות <strong>רציף וללא עריכה</strong></li>
                <li>חובה להראות את <strong>התוצאה הסופית</strong> בבירור</li>
                <li style={{ color: "#c62828", fontWeight: 700 }}>
                  ללא הוכחה - הדחה מהטורניר ללא החזר כספי!
                </li>
              </ul>
            </div>
            
            <Uploader
              onFileSelect={setFile}
              label="וידאו של המחצית השנייה (חובה!) או צילום מסך"
              accept="video/*,image/*"
              required
            />

            {error && (
              <div style={{
                padding: 16,
                background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                color: "#c62828",
                borderRadius: 10,
                border: "2px solid #ef5350",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>❌</span>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              style={{
                width: "100%",
                padding: 18,
                background: loading 
                  ? "#ccc" 
                  : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                boxShadow: loading ? "none" : "0 6px 20px rgba(67, 233, 123, 0.4)"
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {loading ? "⏳ שולח..." : "✅ שלח תוצאה"}
            </button>
          </div>
        )}

        {result && (
          <div style={{
            padding: 32,
            background: result.status === "CONFIRMED" 
              ? "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)" 
              : result.status === "DISPUTED" 
              ? "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)" 
              : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            borderRadius: 16,
            border: `3px solid ${result.status === "CONFIRMED" ? "#43e97b" : 
                                 result.status === "DISPUTED" ? "#fa709a" : "#4facfe"}`,
            textAlign: "center"
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>
              {result.status === "CONFIRMED" ? "✅" : 
               result.status === "DISPUTED" ? "⚠️" : "⏳"}
            </div>
            <h2 style={{ 
              margin: "0 0 12px 0", 
              fontSize: 28,
              fontWeight: 800,
              color: result.status === "CONFIRMED" ? "#2e7d32" :
                     result.status === "DISPUTED" ? "#d84315" : "#1976D2"
            }}>
              {result.status === "CONFIRMED" ? "התוצאה אושרה!" :
               result.status === "DISPUTED" ? "יש מחלוקת בתוצאה" :
               "ההגשה התקבלה"}
            </h2>
            <p style={{ 
              margin: "0 0 24px 0", 
              fontSize: 16, 
              color: result.status === "CONFIRMED" ? "#388e3c" :
                     result.status === "DISPUTED" ? "#e64a19" : "#1565C0",
              lineHeight: 1.6
            }}>
              {result.status === "CONFIRMED" && "שני השחקנים דיווחו על אותה תוצאה. המשחק אושר."}
              {result.status === "DISPUTED" && `${result.reason || "יש אי-התאמה בין הדיווחים"}. המנהל יבדוק את הראיות.`}
              {result.status === "PENDING" && "ממתין לדיווח השחקן השני."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "14px 32px",
                background: "#fff",
                color: "#333",
                border: "2px solid #ddd",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "all 0.3s",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
              }}
            >
              🔄 הגש תוצאה נוספת
            </button>
          </div>
        )}
      </div>

      <div style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        left: 20,
        maxWidth: 600,
        margin: "0 auto",
        padding: 16,
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: 12,
        fontSize: 13,
        color: "#666",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(10px)"
      }}>
        <strong style={{ color: "#667eea", fontSize: 14 }}>💡 הוראות:</strong>
        <ol style={{ margin: "8px 0 0 0", paddingRight: 20, lineHeight: 1.8 }}>
          <li>הזן את ה-Token הפרטי שקיבלת מהמארגן</li>
          <li>הזן את שם המשתמש PSN שלך</li>
          <li>דווח את תוצאת המשחק המדויקת</li>
          <li>הזן את ה-PIN שהוצג בתחילת המשחק (6 תווים)</li>
          <li style={{ color: "#c62828", fontWeight: 700 }}>
            העלה וידאו של המחצית השנייה (חובה!) - MP4, MOV, AVI - מקס 500MB
          </li>
        </ol>
      </div>
    </div>
  );
}
