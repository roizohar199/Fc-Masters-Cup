import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import ProofViewer from "../components/ProofViewer";

interface Dispute {
  id: string;
  tournamentId: string;
  round: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  token: string;
  pin: string;
  submissions: number;
}

interface Submission {
  id: string;
  matchId: string;
  reporterPsn: string;
  scoreHome: number;
  scoreAway: number;
  pin: string;
  evidencePath?: string;
  createdAt: string;
}

export default function DisputesView() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [overrideHome, setOverrideHome] = useState(0);
  const [overrideAway, setOverrideAway] = useState(0);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const data = await api("/api/disputes");
      setDisputes(data);
    } catch (err) {
      console.error("Failed to load disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (matchId: string) => {
    try {
      const data = await api(`/api/matches/${matchId}/submissions`);
      setSubmissions(data);
      setSelectedMatch(matchId);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  const handleOverride = async (matchId: string) => {
    if (!confirm(`האם אתה בטוח שברצונך לאשר את התוצאה ${overrideHome}:${overrideAway}?`)) {
      return;
    }

    try {
      await api(`/api/matches/${matchId}/override`, {
        method: "POST",
        body: JSON.stringify({ homeScore: overrideHome, awayScore: overrideAway })
      });
      alert("התוצאה אושרה בהצלחה!");
      setSelectedMatch(null);
      loadDisputes();
    } catch (err: any) {
      alert(`שגיאה: ${err.message}`);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  return (
    <div style={{
      padding: 24,
      minHeight: "100vh"
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          textAlign: "center"
        }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 8,
            textShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
            letterSpacing: "-0.5px"
          }}>
            ⚽ מנהל טורנירים FC
          </h1>
          <p style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: 500,
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
          }}>
            PS5 • FC25/26 • ניהול מקצועי של טורנירים
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          padding: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          direction: "rtl"
        }}>
          <Link 
            to="/" 
            style={{
              padding: "14px 24px",
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#333",
              borderRadius: 12,
              fontWeight: 500,
              fontSize: 15,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span style={{ fontSize: 18 }}>⚙️</span>
            ניהול
          </Link>
          <Link 
            to="/bracket" 
            style={{
              padding: "14px 24px",
              textDecoration: "none",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#333",
              borderRadius: 12,
              fontWeight: 500,
              fontSize: 15,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span style={{ fontSize: 18 }}>🏆</span>
            צפייה בתוצאות
          </Link>
          <Link 
            to="/disputes" 
            style={{
              padding: "14px 24px",
              textDecoration: "none",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140dd 100%)",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            מחלוקות
          </Link>
        </div>

        {/* Main Content */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)",
          minHeight: 400,
          direction: "rtl"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            padding: "20px",
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(250, 112, 154, 0.3)"
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: 28, 
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <span>⚠️</span>
              ניהול מחלוקות
            </h2>
            <button
              onClick={loadDisputes}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.95)",
                color: loading ? "#999" : "#fa709a",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "all 0.3s"
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {loading ? "⏳ טוען..." : "🔄 רענן"}
            </button>
          </div>

          {disputes.length === 0 && !loading && (
            <div style={{
              padding: 60,
              textAlign: "center",
              background: "linear-gradient(135deg, #e8f5e9 0%, #fff 100%)",
              borderRadius: 16,
              border: "2px dashed #43e97b",
              boxShadow: "0 4px 20px rgba(67, 233, 123, 0.1)"
            }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#2e7d32", marginBottom: 8 }}>
                אין מחלוקות כרגע
              </h3>
              <p style={{ fontSize: 16, color: "#4caf50" }}>
                כל המשחקים תקינים! 🎉
              </p>
            </div>
          )}

          {disputes.length > 0 && (
            <div style={{ display: "grid", gap: 20 }}>
              {disputes.map(dispute => (
                <div
                  key={dispute.id}
                  style={{
                    border: "3px solid #fa709a",
                    borderRadius: 16,
                    padding: 24,
                    background: "linear-gradient(135deg, #fff3e0 0%, #fff 100%)",
                    boxShadow: "0 8px 24px rgba(250, 112, 154, 0.15)",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(250, 112, 154, 0.25)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(250, 112, 154, 0.15)";
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16
                  }}>
                    <div>
                      <h3 style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#d84315"
                      }}>
                        🔥 משחק במחלוקת - {dispute.round}
                      </h3>
                      <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                        Match ID: <code style={{ 
                          backgroundColor: "#fff", 
                          padding: "4px 8px", 
                          borderRadius: 6,
                          border: "1px solid #fa709a",
                          fontWeight: 700
                        }}>{dispute.id.slice(0, 12)}...</code>
                      </div>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        הגשות: <strong style={{ color: "#fa709a" }}>{dispute.submissions || "לא ידוע"}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => loadSubmissions(dispute.id)}
                      style={{
                        padding: "12px 24px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 15,
                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                        transition: "all 0.3s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      🔍 בדוק הגשות
                    </button>
                  </div>

                  {selectedMatch === dispute.id && (
                    <div style={{
                      marginTop: 20,
                      padding: 20,
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                    }}>
                      <h4 style={{ 
                        margin: "0 0 16px 0",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}>
                        <span>📋</span>
                        הגשות שהתקבלו:
                      </h4>
                      
                      {submissions.length === 0 && (
                        <p style={{ color: "#666", textAlign: "center", padding: 20 }}>⏳ טוען הגשות...</p>
                      )}

                      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                        {submissions.map((sub, idx) => (
                          <div
                            key={sub.id}
                            style={{
                              padding: 16,
                              background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
                              borderRadius: 10,
                              border: "2px solid #f0f0f0",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = "#667eea";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.15)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = "#f0f0f0";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15, color: "#667eea" }}>
                              הגשה #{idx + 1} - {sub.reporterPsn}
                            </div>
                            <div style={{ fontSize: 14, marginBottom: 6 }}>
                              תוצאה מדווחת: <strong style={{ 
                                fontSize: 18,
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text"
                              }}>{sub.scoreHome} : {sub.scoreAway}</strong>
                            </div>
                            <div style={{ fontSize: 14, marginBottom: 6 }}>
                              PIN: <code style={{ 
                                backgroundColor: "#fff", 
                                padding: "4px 10px", 
                                borderRadius: 6,
                                fontWeight: 700,
                                border: "1px solid #667eea",
                                color: "#667eea",
                                letterSpacing: 2
                              }}>{sub.pin}</code>
                            </div>
                            <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
                              🕒 {sub.createdAt && !isNaN(new Date(sub.createdAt).getTime()) 
                                ? new Date(sub.createdAt).toLocaleString("he-IL") 
                                : "לא זמין"}
                            </div>
                            {sub.evidencePath && (
                              <a
                                href={`/${sub.evidencePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-block",
                                  padding: "8px 16px",
                                  background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                                  color: "#fff",
                                  textDecoration: "none",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(67, 233, 123, 0.3)",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                              >
                                📸 צפה בראיה
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* תמונות proof */}
                      <ProofViewer
                        matchId={selectedMatch}
                        homePlayer={disputes.find(d => d.id === selectedMatch)?.homePsn || "שחקן בית"}
                        awayPlayer={disputes.find(d => d.id === selectedMatch)?.awayPsn || "שחקן אורח"}
                      />

                      <div style={{
                        padding: 20,
                        background: "linear-gradient(135deg, #e3f2fd 0%, #fff 100%)",
                        borderRadius: 12,
                        border: "3px solid #2196F3"
                      }}>
                        <h4 style={{ 
                          margin: "0 0 16px 0",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#1976D2",
                          display: "flex",
                          alignItems: "center",
                          gap: 8
                        }}>
                          <span>⚖️</span>
                          החלטת מנהל - קבע תוצאה סופית:
                        </h4>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                          gap: 12,
                          alignItems: "center",
                          marginBottom: 12
                        }}>
                          <input
                            type="number"
                            min="0"
                            value={overrideHome}
                            onChange={e => setOverrideHome(Number(e.target.value))}
                            placeholder="בית"
                            style={{
                              padding: 14,
                              border: "2px solid #2196F3",
                              borderRadius: 10,
                              fontSize: 20,
                              textAlign: "center",
                              fontWeight: 800,
                              background: "#fff"
                            }}
                          />
                          <span style={{ fontSize: 28, fontWeight: 800, color: "#2196F3" }}>:</span>
                          <input
                            type="number"
                            min="0"
                            value={overrideAway}
                            onChange={e => setOverrideAway(Number(e.target.value))}
                            placeholder="חוץ"
                            style={{
                              padding: 14,
                              border: "2px solid #2196F3",
                              borderRadius: 10,
                              fontSize: 20,
                              textAlign: "center",
                              fontWeight: 800,
                              background: "#fff"
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleOverride(dispute.id)}
                          style={{
                            width: "100%",
                            padding: "16px",
                            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 800,
                            fontSize: 16,
                            boxShadow: "0 4px 15px rgba(67, 233, 123, 0.4)",
                            transition: "all 0.3s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                          ✅ אשר תוצאה
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
