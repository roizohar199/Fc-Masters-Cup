import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import TawkTo from "./components/TawkTo";
import { api } from "./api";

export default function App() {
  const [me, setMe] = useState<{ ok: boolean; email?: string; role?: string; secondPrizeCredit?: number }>({ ok: false });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const nav = useNavigate();

  // זיהוי מובייל
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // ניסיון רענון role מהדאטאבייס
    api("/api/auth/refresh-role", { method: "POST" })
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => {
        // אם רענון נכשל, נסה את ה-endpoint הרגיל
        api("/api/auth/me")
          .then((data) => {
            setMe(data);
            setLoading(false);
          })
          .catch(() => {
            setMe({ ok: false });
            setLoading(false);
          });
      });
  }, []);

  useEffect(() => {
    if (!loading && !me.ok) {
      nav("/login");
    }
  }, [loading, me.ok, nav]);

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      setMe({ ok: false });
      nav("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>טוען...</div>
        </div>
      </div>
    );
  }

  if (!me.ok) {
    return null;
  }

  const isAdmin = me.role === 'admin';

  return (
    <div style={{
      padding: isMobile ? 12 : 24,
      minHeight: "100vh"
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: isMobile ? 20 : 32,
          textAlign: "center"
        }}>
          <h1 style={{
            fontSize: isMobile ? 28 : 48,
            fontWeight: 800,
            background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 8,
            textShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
            letterSpacing: "-0.5px",
            lineHeight: 1.2
          }}>
            ⚽ {isAdmin ? "מנהל טורנירים FC" : "FC Masters Cup"}
          </h1>
          <p style={{
            fontSize: isMobile ? 14 : 16,
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: 500,
            textShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
          }}>
            PS5 • FC25/26 • {isAdmin ? "ניהול מקצועי של טורנירים" : "אזור שחקנים"}
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 12,
          marginBottom: isMobile ? 20 : 24,
          padding: isMobile ? "16px" : "12px",
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: isMobile ? 12 : 16,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          direction: "rtl",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(140px, 1fr))",
            gap: isMobile ? 8 : 12,
            width: "100%",
            justifyContent: "center"
          }}>
            <Link 
              to="/" 
              style={{
                padding: isMobile ? "12px 16px" : "14px 24px",
                textDecoration: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2dd 100%)",
                color: "#fff",
                borderRadius: isMobile ? 8 : 12,
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 6 : 8,
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: isMobile ? 16 : 18 }}>{isAdmin ? "⚙️" : "🏠"}</span>
              {isMobile ? (isAdmin ? "ניהול" : "בית") : (isAdmin ? "ניהול" : "דף הבית")}
            </Link>
            <Link 
              to="/bracket" 
              style={{
                padding: isMobile ? "12px 16px" : "14px 24px",
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#333",
                borderRadius: isMobile ? 8 : 12,
                fontWeight: 500,
                fontSize: isMobile ? 13 : 15,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 6 : 8,
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: isMobile ? 16 : 18 }}>📊</span>
              {isMobile ? "תוצאות" : "צפה בתוצאות"}
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                style={{
                  padding: isMobile ? "12px 16px" : "14px 24px",
                  textDecoration: "none",
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#333",
                  borderRadius: isMobile ? 8 : 12,
                  fontWeight: 500,
                  fontSize: isMobile ? 13 : 15,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: isMobile ? 16 : 18 }}>👨‍💼</span>
                {isMobile ? "פאנל" : "פאנל ניהול"}
              </Link>
            )}
            {isAdmin && (
              <Link 
                to="/disputes" 
                style={{
                  padding: isMobile ? "12px 16px" : "14px 24px",
                  textDecoration: "none",
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#333",
                  borderRadius: isMobile ? 8 : 12,
                  fontWeight: 500,
                  fontSize: isMobile ? 13 : 15,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: isMobile ? 16 : 18 }}>⚠️</span>
                מחלוקות
              </Link>
            )}
            <Link 
              to="/rules" 
              style={{
                padding: isMobile ? "12px 16px" : "14px 24px",
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#333",
                borderRadius: isMobile ? 8 : 12,
                fontWeight: 500,
                fontSize: isMobile ? 13 : 15,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 6 : 8,
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: isMobile ? 16 : 18 }}>📋</span>
              תקנון
            </Link>
            {!isAdmin && (
              <Link 
                to="/settings" 
                style={{
                  padding: isMobile ? "12px 16px" : "14px 24px",
                  textDecoration: "none",
                  background: "rgba(255, 255, 255, 0.9)",
                  color: "#333",
                  borderRadius: isMobile ? 8 : 12,
                  fontWeight: 500,
                  fontSize: isMobile ? 13 : 15,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  textAlign: "center"
                }}
              >
                <span style={{ fontSize: isMobile ? 16 : 18 }}>⚙️</span>
                הגדרות
              </Link>
            )}
          </div>

          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center", 
            gap: isMobile ? 8 : 12,
            justifyContent: "center",
            marginTop: isMobile ? 0 : "8px",
            width: "100%"
          }}>
            <div style={{
              padding: isMobile ? "6px 12px" : "8px 16px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: isMobile ? 16 : 20,
              fontSize: isMobile ? 12 : 14,
              fontWeight: 600,
              color: "#fff",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isMobile ? "200px" : "none"
            }}>
              👤 {me.email}
            </div>
            <button
              onClick={logout}
              style={{
                padding: isMobile ? "8px 16px" : "10px 20px",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#e91e63",
                border: "none",
                borderRadius: isMobile ? 8 : 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: isMobile ? 12 : 14,
                transition: "all 0.3s",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                width: isMobile ? "100%" : "auto"
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
              🚪 התנתק
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: isMobile ? 12 : 20,
          padding: isMobile ? 16 : 24,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)",
          minHeight: 400
        }}>
          {isAdmin ? <AdminDashboard /> : <PlayerDashboard />}
        </div>
      </div>
      
      {/* Tawk.to Chat Widget */}
      {!isAdmin && <TawkTo />}
    </div>
  );
}
