import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useStore } from "../store";
import ChampionsLeagueBracket from "../components/ChampionsLeagueBracket";
import PlayersList from "../components/PlayersList";

export default function BracketView() {
  const { tournamentId } = useStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const loadBracket = async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const [matchesData, playersData] = await Promise.all([
        api(`/api/tournaments/${tournamentId}/bracket`),
        api(`/api/tournaments/${tournamentId}/players`)
      ]);
      setMatches(matchesData);
      setPlayers(playersData);
    } catch (err) {
      console.error("Failed to load bracket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBracket();
  }, [tournamentId]);

  // זיהוי מובייל
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
              background: "linear-gradient(135deg, #f093fb 0%, #f5576cdd 100%)",
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
            <span style={{ fontSize: 18 }}>🏆</span>
            צפייה בתוצאות
          </Link>
          <Link 
            to="/disputes" 
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
            <span style={{ fontSize: 18 }}>⚠️</span>
            מחלוקות
          </Link>
        </div>

        {/* Main Content */}
        <div style={{
          display: "flex",
          gap: isMobile ? 16 : 24,
          alignItems: "flex-start"
        }}>
          {/* רשימת שחקנים - צד שמאל */}
          <div style={{
            flexShrink: 0,
            order: isMobile ? 2 : 1
          }}>
            {players.length > 0 ? (
              <PlayersList players={players} isMobile={isMobile} />
            ) : tournamentId ? (
              <div style={{
                width: isMobile ? "100%" : "300px",
                minHeight: "200px",
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                borderRadius: isMobile ? 12 : 16,
                padding: isMobile ? 16 : 20,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                border: "2px dashed #ddd",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👥</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#666", margin: "0 0 8px 0" }}>
                  אין שחקנים
                </h3>
                <p style={{ fontSize: 14, color: "#999", margin: 0 }}>
                  טרם נוספו שחקנים לטורניר
                </p>
              </div>
            ) : null}
          </div>

          {/* תוכן ראשי - צד ימין */}
          <div style={{
            flex: 1,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            backdropFilter: "blur(10px)",
            minHeight: 400,
            direction: "rtl",
            order: isMobile ? 1 : 2
          }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            padding: "20px",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(240, 147, 251, 0.3)"
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
              <span>🏆</span>
              תוצאות הטורניר
            </h2>
            {tournamentId && (
              <button
                onClick={loadBracket}
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  background: loading ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.95)",
                  color: loading ? "#999" : "#f5576c",
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
            )}
          </div>

          {!tournamentId && (
            <div style={{
              padding: 60,
              textAlign: "center",
              background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
              borderRadius: 16,
              border: "2px dashed #ddd",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🏆</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#333", marginBottom: 8 }}>
                לא נבחר טורניר
              </h3>
              <p style={{ fontSize: 16, color: "#666" }}>
                צור טורניר בלשונית הניהול כדי להתחיל
              </p>
            </div>
          )}

          {tournamentId && matches.length === 0 && !loading && (
            <div style={{
              padding: 60,
              textAlign: "center",
              background: "linear-gradient(135deg, #e3f2fd 0%, #fff 100%)",
              borderRadius: 16,
              border: "2px dashed #2196F3",
              boxShadow: "0 4px 20px rgba(33, 150, 243, 0.1)"
            }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>⚽</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1976D2", marginBottom: 8 }}>
                טרם נוצרו משחקים
              </h3>
              <p style={{ fontSize: 16, color: "#1565C0" }}>
                הכן את שמינית הגמר בלשונית הניהול
              </p>
            </div>
          )}

          {tournamentId && matches.length > 0 && (
            <ChampionsLeagueBracket matches={matches} players={players} onRefresh={loadBracket} />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
