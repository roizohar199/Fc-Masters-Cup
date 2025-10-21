import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { SendEmailInline } from "../components/SendEmailInline";
import { selectTournamentParticipants } from "../lib/tournamentApi";

interface User {
  id: string;
  email: string;
  role: string;
  secondPrizeCredit: number;
  createdAt: string;
  status?: string;
  psnUsername?: string;
}

interface OnlineUser {
  id: string;
  email: string;
  role: string;
  status: string;
  isOnline: boolean;
  isActive: boolean;
  lastSeen: number | null;
  connections: number;
  psnUsername?: string;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  createdAt: string;
  prizeFirst: number;
  prizeSecond: number;
  nextTournamentDate?: string;
  telegramLink?: string;
}

interface Player {
  id: string;
  psn: string;
  displayName: string;
  status: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "online" | "tournaments" | "players">("users");
  
  // בחירה מרובה
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  
  // בחירת משתתפים לטורניר
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [showEmailForm, setShowEmailForm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadOnlineUsers();
    
    // רענון אוטומטי של משתמשים מחוברים כל 15 שניות
    const interval = setInterval(() => {
      if (activeTab === "online") {
        loadOnlineUsers();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  async function loadData() {
    try {
      const [usersData, tournamentsData] = await Promise.all([
        api("/api/admin/users"),
        api("/api/tournaments")
      ]);
      
      setUsers(usersData || []);
      setTournaments(tournamentsData || []);
      
      // טעינת שחקנים מהטורניר האחרון
      if (tournamentsData && tournamentsData.length > 0) {
        const latestTournament = tournamentsData[0];
        try {
          const playersData = await api(`/api/tournaments/${latestTournament.id}/players`);
          setPlayers(playersData || []);
        } catch (err) {
          console.error("Failed to load players:", err);
          setPlayers([]);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOnlineUsers() {
    try {
      const data = await api("/api/presence/all-users");
      setOnlineUsers(data || []);
    } catch (error) {
      console.error("Failed to load online users:", error);
    }
  }

  async function blockUser(userId: string) {
    if (!confirm("האם אתה בטוח שברצונך לחסום משתמש זה?")) return;
    
    try {
      await api(`/api/admin/users/${userId}/block`, { method: "POST" });
      alert("המשתמש נחסם בהצלחה!");
      loadData();
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  async function unblockUser(userId: string) {
    try {
      await api(`/api/admin/users/${userId}/unblock`, { method: "POST" });
      alert("המשתמש שוחרר בהצלחה!");
      loadData();
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  async function updateUserCredit(userId: string, credit: number) {
    try {
      await api(`/api/admin/users/${userId}/credit`, {
        method: "POST",
        body: JSON.stringify({ credit })
      });
      alert("הזיכוי עודכן בהצלחה!");
      loadData();
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  // פונקציות לבחירה מרובה
  function toggleUserSelection(userId: string) {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }

  function selectAllUsers() {
    const allUserIds = users.map(user => user.id);
    setSelectedUsers(new Set(allUserIds));
  }

  function clearSelection() {
    setSelectedUsers(new Set());
  }

  async function bulkBlockUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך לחסום ${selectedUsers.size} משתמשים?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api(`/api/admin/users/${userId}/block`, { method: "POST" });
      }
      alert(`🚫 ${selectedUsers.size} משתמשים נחסמו!`);
      clearSelection();
      await loadData();
    } catch (error: any) {
      alert(`❌ שגיאה בחסימת המשתמשים: ${error.message}`);
    }
  }

  async function bulkUnblockUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך לבטל חסימה ל-${selectedUsers.size} משתמשים?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api(`/api/admin/users/${userId}/unblock`, { method: "POST" });
      }
      alert(`✅ חסימה בוטלה ל-${selectedUsers.size} משתמשים!`);
      clearSelection();
      await loadData();
    } catch (error: any) {
      alert(`❌ שגיאה בשחרור המשתמשים: ${error.message}`);
    }
  }

  async function bulkDeleteUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`⚠️ האם אתה בטוח שברצונך למחוק ${selectedUsers.size} משתמשים?\n\n${selectedUserNames}\n\nפעולה זו תמחק את המשתמשים לצמיתות ולא ניתן לבטל אותה!`)) {
      return;
    }

    if (!confirm(`אישור סופי: למחוק ${selectedUsers.size} משתמשים?`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api(`/api/admin/users/${userId}`, { method: "DELETE" });
      }
      alert(`✅ ${selectedUsers.size} משתמשים נמחקו בהצלחה!`);
      clearSelection();
      await loadData();
    } catch (error: any) {
      alert(`❌ שגיאה במחיקת המשתמשים: ${error.message}`);
    }
  }

  async function bulkUpdateCredit() {
    if (selectedUsers.size === 0) return;
    
    const credit = prompt(`הזן סכום זיכוי עבור ${selectedUsers.size} משתמשים (₪):`, "0");
    if (credit === null) return;
    
    const creditNum = parseFloat(credit);
    if (isNaN(creditNum)) {
      alert("סכום לא תקין");
      return;
    }

    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך לעדכן זיכוי ל-${selectedUsers.size} משתמשים?\n\n${selectedUserNames}\n\nסכום: ${creditNum} ₪`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api(`/api/admin/users/${userId}/credit`, {
          method: "POST",
          body: JSON.stringify({ credit: creditNum })
        });
      }
      alert(`✅ זיכוי עודכן ל-${selectedUsers.size} משתמשים!`);
      clearSelection();
      await loadData();
    } catch (error: any) {
      alert(`❌ שגיאה בעדכון הזיכוי: ${error.message}`);
    }
  }

  // פונקציות לבחירת משתתפים לטורניר
  async function selectParticipantsForTournament() {
    if (!selectedTournament || selectedUsers.size === 0) {
      alert("נא לבחור טורניר ומשתמשים");
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך לבחור ${selectedUsers.size} משתמשים לטורניר?`)) {
      return;
    }

    try {
      const userIds = Array.from(selectedUsers).map(id => parseInt(id));
      await selectTournamentParticipants(parseInt(selectedTournament), userIds);
      alert(`✅ ${selectedUsers.size} משתמשים נבחרו לטורניר וקיבלו התראות!`);
      clearSelection();
      setSelectedTournament("");
    } catch (error: any) {
      alert(`❌ שגיאה בבחירת משתתפים: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#667eea" }}>טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* חזרה לדף הבית */}
        <div style={{ marginBottom: 24 }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "rgba(255, 255, 255, 0.2)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              transition: "all 0.3s"
            }}
          >
            ← חזור לדף הבית
          </Link>
        </div>

        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ display: "grid", gap: 24, direction: "rtl" }}>
            {/* כותרת */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: 32,
              borderRadius: 16,
              color: "#fff",
              boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)"
            }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <span>👨‍💼</span>
                פאנל ניהול מתקדם
              </h2>
              <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>
                ניהול משתמשים, טורנירים ושחקנים
              </p>
            </div>

      {/* סטטיסטיקות */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{
          background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          padding: 24,
          borderRadius: 16,
          color: "#fff",
          boxShadow: "0 4px 15px rgba(67, 233, 123, 0.3)"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>סה"כ משתמשים</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{users.length}</div>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          padding: 24,
          borderRadius: 16,
          color: "#fff",
          boxShadow: "0 4px 15px rgba(250, 112, 154, 0.3)"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>סה"כ טורנירים</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{tournaments.length}</div>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          padding: 24,
          borderRadius: 16,
          color: "#fff",
          boxShadow: "0 4px 15px rgba(79, 172, 254, 0.3)"
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>שחקנים פעילים</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>
            {players.filter(p => p.status === "ACTIVE").length}
          </div>
        </div>
      </div>

      {/* טאבים */}
      <div style={{
        display: "flex",
        gap: 12,
        borderBottom: "2px solid #e0e0e0",
        paddingBottom: 16,
        flexWrap: "wrap"
      }}>
        {[
          { id: "users", label: "משתמשים", icon: "👥" },
          { id: "online", label: "מחוברים כעת", icon: "🟢" },
          { id: "tournaments", label: "טורנירים", icon: "🏆" },
          { id: "players", label: "שחקנים", icon: "⚽" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: 10,
              background: activeTab === tab.id 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "#f5f5f5",
              color: activeTab === tab.id ? "#fff" : "#666",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: activeTab === tab.id ? "0 4px 15px rgba(102, 126, 234, 0.3)" : "none"
            }}
          >
            <span style={{ marginLeft: 8 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* תוכן הטאב */}
      {activeTab === "users" && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#333" }}>
            👥 ניהול משתמשים
          </h3>
          
          {/* כפתורי בחירה מרובה */}
          <div style={{ 
            display: "flex", 
            gap: 12, 
            marginBottom: 16, 
            padding: 16, 
            background: "#f8f9fa", 
            borderRadius: 8, 
            border: "1px solid #e9ecef",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <button
              onClick={() => setBulkActionMode(!bulkActionMode)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: bulkActionMode ? "#dc3545" : "#007bff",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              {bulkActionMode ? "❌ ביטול בחירה מרובה" : "☑️ בחירה מרובה"}
            </button>
            
            {bulkActionMode && (
              <>
                <button
                  onClick={selectAllUsers}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #6c757d",
                    background: "#fff",
                    color: "#6c757d",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  ☑️ בחר הכל
                </button>
                
                <button
                  onClick={clearSelection}
                  disabled={selectedUsers.size === 0}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #6c757d",
                    background: selectedUsers.size === 0 ? "#f8f9fa" : "#fff",
                    color: selectedUsers.size === 0 ? "#adb5bd" : "#6c757d",
                    cursor: selectedUsers.size === 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  🗑️ נקה בחירה
                </button>
                
                {selectedUsers.size > 0 && (
                  <div style={{ 
                    marginLeft: "auto", 
                    display: "flex", 
                    gap: 8, 
                    flexWrap: "wrap",
                    alignItems: "center"
                  }}>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: "#495057" 
                    }}>
                      {selectedUsers.size} נבחרו
                    </span>
                    
                    <button
                      onClick={bulkBlockUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#dc3545",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      🚫 חסום
                    </button>
                    
                    <button
                      onClick={bulkUnblockUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#20c997",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      ✅ בטל חסימה
                    </button>
                    
                    <button
                      onClick={bulkUpdateCredit}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#17a2b8",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      💰 עדכן זיכוי
                    </button>
                    
                    <button
                      onClick={bulkDeleteUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#343a40",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      🗑️ מחק
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* בחירת משתתפים לטורניר */}
            {bulkActionMode && selectedUsers.size > 0 && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: "#e3f2fd",
                borderRadius: 8,
                border: "1px solid #2196f3"
              }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: 16 }}>
                  🏆 בחירת משתתפים לטורניר
                </h4>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      fontSize: 14,
                      minWidth: 200
                    }}
                  >
                    <option value="">בחר טורניר...</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={selectParticipantsForTournament}
                    disabled={!selectedTournament}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: selectedTournament ? "#4caf50" : "#ccc",
                      color: "#fff",
                      cursor: selectedTournament ? "pointer" : "not-allowed",
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    🎯 בחר משתתפים ({selectedUsers.size})
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}>
              <thead>
                <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #e0e0e0" }}>
                  {bulkActionMode && (
                    <th style={{ padding: 12, textAlign: "center", fontWeight: 700, width: "50px" }}>
                      ☑️
                    </th>
                  )}
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 700 }}>אימייל</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>PSN</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>תפקיד</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>זיכוי (₪)</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>תאריך הצטרפות</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>סטטוס</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <React.Fragment key={user.id}>
                  <tr style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                    opacity: selectedUsers.has(user.id) ? 0.7 : 1
                  }}>
                    {bulkActionMode && (
                      <td style={{ padding: 12, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          style={{
                            width: 18,
                            height: 18,
                            cursor: "pointer"
                          }}
                        />
                      </td>
                    )}
                    <td style={{ padding: 12 }}>{user.email}</td>
                    <td style={{ padding: 12, textAlign: "center", fontFamily: "monospace", fontSize: 13 }}>
                      {user.psnUsername || <span style={{ color: "#999" }}>לא הוגדר</span>}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: user.role === "admin" 
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                        color: "#fff"
                      }}>
                        {user.role === "admin" ? "מנהל" : "שחקן"}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>
                      {user.secondPrizeCredit > 0 ? `${user.secondPrizeCredit} ₪` : "-"}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      {user.createdAt && !isNaN(new Date(user.createdAt).getTime()) 
                        ? new Date(user.createdAt).toLocaleDateString("he-IL") 
                        : "לא זמין"}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: user.status === "blocked" ? "#f44336" : "#4caf50",
                        color: "#fff"
                      }}>
                        {user.status === "blocked" ? "חסום" : "פעיל"}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        {user.status !== "blocked" ? (
                          <button
                            onClick={() => blockUser(user.id)}
                            disabled={user.role === "admin"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: user.role === "admin" ? "#ccc" : "#f44336",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: user.role === "admin" ? "not-allowed" : "pointer"
                            }}
                          >
                            🚫 חסום
                          </button>
                        ) : (
                          <button
                            onClick={() => unblockUser(user.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#4caf50",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            ✓ שחרר
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const credit = prompt("הזן סכום זיכוי (₪):", String(user.secondPrizeCredit));
                            if (credit !== null) {
                              updateUserCredit(user.id, Number(credit));
                            }
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#ff9800",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          💰 זיכוי
                        </button>
                        
                        <button
                          onClick={() => setShowEmailForm(showEmailForm === user.id ? null : user.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#9c27b0",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          📧 מייל
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* טופס שליחת מייל */}
                  {showEmailForm === user.id && (
                    <tr>
                      <td colSpan={bulkActionMode ? 8 : 7} style={{ padding: 0, background: "#f8f9fa" }}>
                        <SendEmailInline userId={parseInt(user.id)} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "online" && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#333" }}>
              🟢 משתמשים מחוברים כעת
            </h3>
            <button
              onClick={loadOnlineUsers}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "2px solid #667eea",
                background: "#fff",
                color: "#667eea",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#667eea";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#667eea";
              }}
            >
              🔄 רענן
            </button>
          </div>
          
          <div style={{ 
            display: "grid", 
            gap: 16, 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" 
          }}>
            {onlineUsers.length === 0 ? (
              <div style={{ 
                padding: 40, 
                textAlign: "center", 
                color: "#999",
                gridColumn: "1 / -1"
              }}>
                אין משתמשים מחוברים כרגע
              </div>
            ) : (
              onlineUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    padding: 20,
                    background: user.isOnline 
                      ? "linear-gradient(135deg, #e8f5e9 0%, #fff 100%)"
                      : "linear-gradient(135deg, #f5f5f5 0%, #fff 100%)",
                    borderRadius: 12,
                    border: `2px solid ${user.isOnline ? "#4caf50" : "#e0e0e0"}`,
                    position: "relative",
                    transition: "all 0.3s"
                  }}
                >
                  {/* אינדיקטור סטטוס */}
                  <div style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: user.isOnline 
                      ? (user.isActive ? "#4caf50" : "#ff9800")
                      : "#ccc",
                    boxShadow: user.isOnline 
                      ? "0 0 8px rgba(76, 175, 80, 0.6)"
                      : "none",
                    animation: user.isActive ? "pulse 2s infinite" : "none"
                  }} />

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: "#333",
                      marginBottom: 4,
                      wordBreak: "break-word"
                    }}>
                      {user.email}
                    </div>
                    {user.psnUsername && (
                      <div style={{ 
                        fontSize: 13, 
                        color: "#666",
                        fontFamily: "monospace",
                        marginBottom: 8
                      }}>
                        🎮 {user.psnUsername}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>סטטוס:</span>
                      <span style={{ 
                        fontWeight: 700,
                        color: user.isOnline ? "#4caf50" : "#999"
                      }}>
                        {user.isOnline ? (user.isActive ? "🟢 פעיל" : "🟡 מחובר") : "⚫ לא מחובר"}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#666" }}>תפקיד:</span>
                      <span style={{ 
                        fontWeight: 600,
                        color: user.role === "admin" ? "#667eea" : "#43e97b"
                      }}>
                        {user.role === "admin" ? "👨‍💼 מנהל" : "🎮 שחקן"}
                      </span>
                    </div>
                    
                    {user.connections > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>חיבורים:</span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          {user.connections}
                        </span>
                      </div>
                    )}
                    
                    {user.lastSeen && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#666" }}>נראה לאחרונה:</span>
                        <span style={{ fontWeight: 600, color: "#666", fontSize: 12 }}>
                          {new Date(user.lastSeen).toLocaleTimeString("he-IL")}
                        </span>
                      </div>
                    )}
                  </div>

                  {user.status === "blocked" && (
                    <div style={{
                      marginTop: 12,
                      padding: "6px 12px",
                      background: "#f44336",
                      color: "#fff",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: "center"
                    }}>
                      🚫 משתמש חסום
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "tournaments" && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#333" }}>
            🏆 היסטוריית טורנירים
          </h3>
          
          <div style={{ display: "grid", gap: 16 }}>
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                style={{
                  padding: 20,
                  background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
                  borderRadius: 12,
                  border: "2px solid #f0f0f0",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: "#333", margin: "0 0 8px 0" }}>
                    {tournament.title}
                  </h4>
                  <div style={{ fontSize: 14, color: "#666", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span>🎮 {tournament.game}</span>
                    <span>📅 {tournament.createdAt && !isNaN(new Date(tournament.createdAt).getTime()) 
                      ? new Date(tournament.createdAt).toLocaleDateString("he-IL") 
                      : "לא זמין"}</span>
                    {tournament.telegramLink && <span>💬 קבוצת טלגרם</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    padding: 12,
                    background: "#ffd700",
                    borderRadius: 10,
                    textAlign: "center",
                    minWidth: 100
                  }}>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>🥇 ראשון</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#d84315" }}>
                      {tournament.prizeFirst} ₪
                    </div>
                  </div>
                  <div style={{
                    padding: 12,
                    background: "#e0e0e0",
                    borderRadius: 10,
                    textAlign: "center",
                    minWidth: 100
                  }}>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>🥈 שני</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#666" }}>
                      {tournament.prizeSecond} ₪
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "players" && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#333" }}>
            ⚽ שחקנים בטורניר הנוכחי
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  padding: 16,
                  background: player.status === "ACTIVE"
                    ? "linear-gradient(135deg, #e8f5e9 0%, #fff 100%)"
                    : "linear-gradient(135deg, #ffebee 0%, #fff 100%)",
                  borderRadius: 12,
                  border: `2px solid ${player.status === "ACTIVE" ? "#4caf50" : "#f44336"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: player.status === "ACTIVE" ? "#4caf50" : "#f44336",
                    color: "#fff"
                  }}>
                    {player.status === "ACTIVE" ? "פעיל" : "הודח"}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 4 }}>
                  {player.displayName}
                </div>
                <div style={{ fontSize: 13, color: "#666", fontFamily: "monospace" }}>
                  {player.psn}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

