import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useStore } from "../store";
import { TournamentRegistrationsPanel } from "../components/TournamentRegistrationsPanel";
import { PlayerSelectionPanel } from "../components/admin/PlayerSelectionPanel";
import { startPresence, onPresenceUpdate } from "../presence";

interface User {
  id: string;
  email: string;
  role: string;
  secondPrizeCredit: number;
  createdAt: string;
  status?: string;
  isOnline?: boolean;
  isActive?: boolean;
  lastSeen?: number;
  connections?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isSuperAdmin?: boolean;
  psnUsername?: string;
}

// רשימה של שחקנים אמיתיים - תתעדכן מהמסד נתונים

export default function AdminDashboard() {
  const [title, setTitle] = useState("טורניר שישי בערב");
  const [game, setGame] = useState<"FC25" | "FC26">("FC25");
  const [first, setFirst] = useState(1000);
  const [second, setSecond] = useState(500);
  const [nextTournamentDate, setNextTournamentDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // הוספת מנהל חדש
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  
  // בקשות אישור
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  
  // ניהול בחירת שחקנים
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  // סטטוס נרשמים לטורניר
  const [tournamentRegistrations, setTournamentRegistrations] = useState<{
    tournament: any;
    registrations: any[];
    totalRegistrations: number;
  }>({ tournament: null, registrations: [], totalRegistrations: 0 });
  
  // מצב כפתורים - האם השלב כבר הופעל
  
  // ניהול משתמשים
  const [users, setUsers] = useState<User[]>([]);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  
  // בחירה מרובה
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  
  // שחקנים אמיתיים (משתמשים עם role = 'player')
  const [availablePlayers, setAvailablePlayers] = useState<Array<{id: string, psn: string, displayName: string, email: string, isOnline?: boolean}>>([]);
  
  // חיפוש שחקנים
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  
  // טורנירים קיימים
  const [existingTournaments, setExistingTournaments] = useState<Array<{id: string, title: string, createdAt: string}>>([]);
  
  // Presence system
  const [presenceUsers, setPresenceUsers] = useState<{uid:string;email:string;lastSeen:number}[]>([]);
  
  const { tournamentId, setTournamentId } = useStore();

  // פונקציות עזר לתאריכון
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("he-IL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNextTournamentDate(value);
    if (value) {
      setNextTournamentDate(formatDateForDisplay(value));
    }
  };

  // טעינת משתמשים
  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadTournaments();
    loadTournamentRegistrations();
    
    // רענון אוטומטי של בקשות אישור כל 30 שניות
    const interval = setInterval(() => {
      if (isSuperAdmin) {
        loadPendingRequests();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  async function loadCurrentUser() {
    try {
      const me = await api("/api/auth/me");
      setIsSuperAdmin(me.isSuperAdmin || false);
      setCurrentUserEmail(me.email || "");
      console.log("👑 Super Admin:", me.isSuperAdmin, "Email:", me.email);
      
      // אם זה מנהל על, טען בקשות אישור
      if (me.isSuperAdmin) {
        await loadPendingRequests();
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  }

  async function loadPendingRequests() {
    try {
      const requests = await api("/api/approval-requests/pending");
      setPendingRequests(requests || []);
      console.log("📋 בקשות ממתינות:", requests?.length || 0);
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    }
  }

  async function approveRequest(requestId: string) {
    if (!confirm("האם אתה בטוח שברצונך לאשר בקשה זו?")) return;
    
    try {
      await api(`/api/approval-requests/${requestId}/approve`, {
        method: "POST"
      });
      alert("✅ הבקשה אושרה והפעולה בוצעה!");
      await loadPendingRequests();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  async function rejectRequest(requestId: string) {
    if (!confirm("האם אתה בטוח שברצונך לדחות בקשה זו?")) return;
    
    try {
      await api(`/api/approval-requests/${requestId}/reject`, {
        method: "POST"
      });
      alert("❌ הבקשה נדחתה");
      await loadPendingRequests();
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  // Presence system
  useEffect(() => {
    startPresence();
    const off = onPresenceUpdate((users) => {
      console.log("🔄 Presence update received:", users);
      setPresenceUsers(users);
    });
    return () => off();
  }, []);

  // בדיקת משתמשים מחוברים - גישה פשוטה
  async function checkOnlineUsers() {
    try {
      console.log("🔍 בודק משתמשים מחוברים...");
      const response = await api("/api/admin/online-users");
      console.log("📊 תגובת השרת:", response);
      
      if (response && response.allUsers && Array.isArray(response.allUsers)) {
        // עדכון רשימת המשתמשים עם נתוני נוכחות
        setUsers(response.allUsers);
        
        // יצירת Set של משתמשים מחוברים
        const onlineSet = new Set<string>(response.allUsers.filter((u: any) => u.isOnline).map((u: any) => u.id));
        console.log("✅ משתמשים מחוברים:", Array.from(onlineSet));
        setOnlineUsers(onlineSet);
      } else if (response && response.onlineUsers && Array.isArray(response.onlineUsers)) {
        // fallback לגישה הישנה
        const onlineSet = new Set<string>(response.onlineUsers as string[]);
        console.log("✅ משתמשים מחוברים (fallback):", Array.from(onlineSet));
        setOnlineUsers(onlineSet);
      } else {
        console.log("⚠️ אין משתמשים מחוברים או תגובה לא תקינה");
      }
    } catch (error) {
      console.error("❌ שגיאה בבדיקת משתמשים מחוברים:", error);
    }
  }

  // רענון רשימת משתמשים מחוברים כל 10 שניות (יותר תכוף)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 רענון אוטומטי של משתמשים מחוברים...");
      checkOnlineUsers();
    }, 10000); // 10 שניות

    return () => clearInterval(interval);
  }, [users]);

  // סגירת תאריכון כשלוחצים מחוץ לו
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePicker && !target.closest('[data-datepicker]')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  async function loadUsers() {
    try {
      console.log("🔄 טוען משתמשים...");
      const usersData = await api("/api/admin/users");
      console.log("📊 נתונים שהתקבלו מהשרת:", usersData);
      setUsers(usersData || []);
      
      // טעינת משתמשים עם סטטוס מחובר
      try {
        const onlineStatusData = await api("/api/admin/users/online-status");
        console.log("🌐 נתוני סטטוס מחובר:", onlineStatusData);
        
        // יצירת רשימת שחקנים זמינים עם סטטוס מחובר
        const players = (onlineStatusData.allUsers || [])
          .filter((user: User) => {
            const isPlayer = user.role === 'player';
            const notBlocked = user.status !== 'blocked';
            console.log(`👤 ${user.email}: role=${user.role}, status=${user.status}, isPlayer=${isPlayer}, notBlocked=${notBlocked}, isOnline=${user.isOnline}`);
            return isPlayer && notBlocked;
          })
          .map((user: User) => ({
            id: user.id,
            psn: user.psnUsername || user.email.split('@')[0],
            displayName: user.psnUsername || user.email.split('@')[0],
            email: user.email,
            isOnline: user.isOnline || false
          }));
        
        console.log("⚽ שחקנים זמינים עם סטטוס:", players);
        console.log("📈 מספר שחקנים זמינים:", players.length);
        setAvailablePlayers(players);
      } catch (onlineError) {
        console.warn("⚠️ לא ניתן לטעון סטטוס מחובר, משתמש בנתונים רגילים:", onlineError);
        
        // fallback לנתונים רגילים
        const players = (usersData || [])
          .filter((user: User) => {
            const isPlayer = user.role === 'player';
            const notBlocked = user.status !== 'blocked';
            return isPlayer && notBlocked;
          })
          .map((user: User) => ({
            id: user.id,
            psn: user.psnUsername || user.email.split('@')[0],
            displayName: user.psnUsername || user.email.split('@')[0],
            email: user.email,
            isOnline: false
          }));
        
        setAvailablePlayers(players);
      }
    } catch (error) {
      console.error("❌ Failed to load users:", error);
    }
  }

  // טעינת סטטוס נרשמים לטורניר
  async function loadTournamentRegistrations() {
    try {
      console.log("🏆 טוען סטטוס נרשמים לטורניר...");
      const data = await api("/api/admin/tournament-registrations");
      console.log("📊 נתוני רישומים:", data);
      setTournamentRegistrations(data);
    } catch (error) {
      console.error("❌ שגיאה בטעינת רישומים לטורניר:", error);
    }
  }

  async function approveUser(userId: string) {
    if (!confirm("האם אתה בטוח שברצונך לאשר משתמש זה?")) return;
    
    try {
      await api("/api/admin-approval/approve-user-api", {
        method: "POST",
        body: JSON.stringify({ userId })
      });
      alert("המשתמש אושר בהצלחה!");
      await loadUsers(); // רענון רשימת המשתמשים
      await loadPendingRequests(); // רענון בקשות האישור
    } catch (error: any) {
      alert(`שגיאה באישור המשתמש: ${error.message}`);
    }
  }

  async function rejectUser(userId: string) {
    if (!confirm("האם אתה בטוח שברצונך לדחות משתמש זה?")) return;
    
    try {
      await api("/api/admin-approval/reject-user-api", {
        method: "POST",
        body: JSON.stringify({ userId })
      });
      alert("המשתמש נדחה");
      await loadUsers(); // רענון רשימת המשתמשים
      await loadPendingRequests(); // רענון בקשות האישור
    } catch (error: any) {
      alert(`שגיאה בדחיית המשתמש: ${error.message}`);
    }
  }

  async function deleteUser(userId: string, userEmail: string, userRole: string) {
    const isAdmin = userRole === 'admin';
    const warningMessage = isAdmin 
      ? `⚠️ אתה עומד למחוק משתמש מנהל!\n\nהאם אתה בטוח שברצונך למחוק את "${userEmail}"?\n\nפעולה זו תמחק את המשתמש לצמיתות ולא ניתן לבטל אותה!`
      : `האם אתה בטוח שברצונך למחוק את המשתמש "${userEmail}"?\n\n⚠️ פעולה זו תמחק את המשתמש לצמיתות ולא ניתן לבטל אותה!`;
    
    if (!confirm(warningMessage)) {
      return;
    }
    
    // אישור נוסף למניעת מחיקה בטעות
    if (!confirm(`אישור סופי: למחוק את ${userEmail}?`)) {
      return;
    }
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}`, {
          method: "DELETE"
        });
        alert("✅ המשתמש נמחק בהצלחה!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "delete",
            targetUserId: userId,
            actionData: {}
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  async function promoteToAdmin(userId: string, userEmail: string) {
    if (!confirm(`האם אתה בטוח שברצונך להפוך את "${userEmail}" למנהל?`)) {
      return;
    }
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/promote`, {
          method: "POST"
        });
        alert("✅ המשתמש הועלה לדרגת מנהל!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "promote",
            targetUserId: userId,
            actionData: {}
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  async function demoteToPlayer(userId: string, userEmail: string) {
    if (!confirm(`האם אתה בטוח שברצונך להוריד את "${userEmail}" לדרגת שחקן?`)) {
      return;
    }
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/demote`, {
          method: "POST"
        });
        alert("✅ המשתמש הורד לדרגת שחקן!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "demote",
            targetUserId: userId,
            actionData: {}
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  async function addNewAdmin() {
    if (!newAdminEmail || !newAdminPassword) {
      alert("אנא מלא אימייל וסיסמה");
      return;
    }
    
    if (newAdminPassword.length < 6) {
      alert("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    try {
      await api("/api/admin/users/add-admin", {
        method: "POST",
        body: JSON.stringify({ 
          email: newAdminEmail, 
          password: newAdminPassword 
        })
      });
      
      alert("✅ מנהל חדש נוצר בהצלחה!");
      setNewAdminEmail("");
      setNewAdminPassword("");
      await loadUsers(); // רענון רשימת המשתמשים
    } catch (error: any) {
      alert(`❌ שגיאה ביצירת המנהל: ${error.message}`);
    }
  }

  async function loadTournaments() {
    try {
      const tournaments = await api("/api/tournaments");
      console.log("🏆 טורנירים נטענו:", tournaments);
      console.log("🔍 מספר טורנירים:", tournaments?.length);
      if (tournaments && tournaments.length > 0) {
        console.log("📋 רשימת טורנירים:");
        tournaments.forEach((t: any, index: number) => {
          console.log(`  ${index + 1}. ${t.title} (ID: ${t.id})`);
        });
      }
      setExistingTournaments(tournaments || []);
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    }
  }

  async function deleteTournament(tournamentId: string, tournamentTitle: string) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הטורניר "${tournamentTitle}"?\n\nפעולה זו תמחק גם את כל המשחקים וההגשות של הטורניר ולא ניתן לבטל אותה!`)) {
      return;
    }
    
    try {
      await api(`/api/tournaments/${tournamentId}`, {
        method: "DELETE"
      });
      
      alert("✅ הטורניר נמחק בהצלחה!");
      
      // אם זה הטורניר הפעיל, נאפס אותו
      if (tournamentId === tournamentId) {
        setTournamentId(null);
      }
      
      // רענון רשימת הטורנירים
      await loadTournaments();
    } catch (error: any) {
      alert(`❌ שגיאה במחיקת הטורניר: ${error.message}`);
    }
  }


  async function blockUser(userId: string, userEmail: string) {
    if (!confirm(`האם אתה בטוח שברצונך לחסום את ${userEmail}?`)) return;
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/block`, { method: "POST" });
        alert("המשתמש נחסם בהצלחה!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "block",
            targetUserId: userId,
            actionData: {}
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      loadUsers();
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  async function unblockUser(userId: string, userEmail: string) {
    if (!confirm(`האם אתה בטוח שברצונך לשחרר את ${userEmail}?`)) return;
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/unblock`, { method: "POST" });
        alert("המשתמש שוחרר בהצלחה!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "unblock",
            targetUserId: userId,
            actionData: {}
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      loadUsers();
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  async function resetUserPassword(userId: string, userEmail: string) {
    const newPassword = prompt(`הזן סיסמה חדשה עבור ${userEmail}:`, "");
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      alert("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    if (!confirm(`האם אתה בטוח שברצונך לשנות את הסיסמה של ${userEmail}?`)) return;
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/reset-password`, {
          method: "POST",
          body: JSON.stringify({ newPassword })
        });
        alert("הסיסמה שונתה בהצלחה!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "reset-password",
            targetUserId: userId,
            actionData: { newPassword }
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
    } catch (error: any) {
      alert(`שגיאה: ${error.message}`);
    }
  }

  async function updateUserCredit(userId: string, userEmail: string, currentCredit: number) {
    const credit = prompt(`הזן סכום זיכוי עבור ${userEmail} (₪):`, String(currentCredit));
    if (credit === null) return;
    
    const creditNum = Number(credit);
    if (isNaN(creditNum) || creditNum < 0) {
      alert("סכום לא תקין");
      return;
    }
    
    try {
      if (isSuperAdmin) {
        // מנהל על - ביצוע ישיר
        await api(`/api/admin/users/${userId}/credit`, {
          method: "POST",
          body: JSON.stringify({ credit: creditNum })
        });
        alert("הזיכוי עודכן בהצלחה!");
      } else {
        // מנהל רגיל - יצירת בקשת אישור
        await api("/api/approval-requests/create", {
          method: "POST",
          body: JSON.stringify({
            actionType: "update-credit",
            targetUserId: userId,
            actionData: { credit: creditNum }
          })
        });
        alert("🕐 הבקשה נשלחה למנהל העל לאישור");
      }
      loadUsers();
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

  async function bulkApproveUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך לאשר ${selectedUsers.size} משתמשים?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api("/api/admin-approval/approve-user-api", {
          method: "POST",
          body: JSON.stringify({ userId })
        });
      }
      alert(`✅ ${selectedUsers.size} משתמשים אושרו בהצלחה!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה באישור המשתמשים: ${error.message}`);
    }
  }

  async function bulkRejectUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך לדחות ${selectedUsers.size} משתמשים?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        await api("/api/admin-approval/reject-user-api", {
          method: "POST",
          body: JSON.stringify({ userId })
        });
      }
      alert(`❌ ${selectedUsers.size} משתמשים נדחו!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה בדחיית המשתמשים: ${error.message}`);
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
        const user = users.find(u => u.id === userId);
        if (user) {
          if (isSuperAdmin) {
            await api(`/api/admin/users/${userId}`, { method: "DELETE" });
          } else {
            await api("/api/approval-requests/create", {
              method: "POST",
              body: JSON.stringify({
                actionType: "delete",
                targetUserId: userId,
                actionData: {}
              })
            });
          }
        }
      }
      alert(`✅ ${selectedUsers.size} משתמשים נמחקו בהצלחה!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה במחיקת המשתמשים: ${error.message}`);
    }
  }

  async function bulkPromoteUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך להפוך ${selectedUsers.size} משתמשים למנהלים?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        if (isSuperAdmin) {
          await api(`/api/admin/users/${userId}/promote`, { method: "POST" });
        } else {
          await api("/api/approval-requests/create", {
            method: "POST",
            body: JSON.stringify({
              actionType: "promote",
              targetUserId: userId,
              actionData: {}
            })
          });
        }
      }
      alert(`✅ ${selectedUsers.size} משתמשים הועלו לדרגת מנהל!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה בקידום המשתמשים: ${error.message}`);
    }
  }

  async function bulkDemoteUsers() {
    if (selectedUsers.size === 0) return;
    
    const selectedUserNames = users
      .filter(user => selectedUsers.has(user.id))
      .map(user => user.email)
      .join(", ");
    
    if (!confirm(`האם אתה בטוח שברצונך להוריד ${selectedUsers.size} משתמשים לדרגת שחקן?\n\n${selectedUserNames}`)) {
      return;
    }

    try {
      for (const userId of selectedUsers) {
        if (isSuperAdmin) {
          await api(`/api/admin/users/${userId}/demote`, { method: "POST" });
        } else {
          await api("/api/approval-requests/create", {
            method: "POST",
            body: JSON.stringify({
              actionType: "demote",
              targetUserId: userId,
              actionData: {}
            })
          });
        }
      }
      alert(`✅ ${selectedUsers.size} משתמשים הורדו לדרגת שחקן!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה בהורדת המשתמשים: ${error.message}`);
    }
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
        if (isSuperAdmin) {
          await api(`/api/admin/users/${userId}/block`, { method: "POST" });
        } else {
          await api("/api/approval-requests/create", {
            method: "POST",
            body: JSON.stringify({
              actionType: "block",
              targetUserId: userId,
              actionData: {}
            })
          });
        }
      }
      alert(`🚫 ${selectedUsers.size} משתמשים נחסמו!`);
      clearSelection();
      await loadUsers();
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
        if (isSuperAdmin) {
          await api(`/api/admin/users/${userId}/unblock`, { method: "POST" });
        } else {
          await api("/api/approval-requests/create", {
            method: "POST",
            body: JSON.stringify({
              actionType: "unblock",
              targetUserId: userId,
              actionData: {}
            })
          });
        }
      }
      alert(`✅ חסימה בוטלה ל-${selectedUsers.size} משתמשים!`);
      clearSelection();
      await loadUsers();
    } catch (error: any) {
      alert(`❌ שגיאה בשחרור המשתמשים: ${error.message}`);
    }
  }

  async function createTournament() {
    console.log("🏆 יוצר טורניר חדש - נתונים שנשלחים:", {
      title, 
      game, 
      prizeFirst: first, 
      prizeSecond: second,
      nextTournamentDate: nextTournamentDate || undefined,
    });
    
    console.log("🔍 בדיקת ערכי השדות:");
    console.log("  - title:", title);
    console.log("  - game:", game);
    console.log("  - prizeFirst:", first);
    console.log("  - prizeSecond:", second);
    console.log("  - nextTournamentDate:", nextTournamentDate);
    
    try {
      const data = await api("/api/tournaments", {
        method: "POST",
        body: JSON.stringify({ 
          title, 
          game, 
          prizeFirst: first, 
          prizeSecond: second,
          nextTournamentDate: nextTournamentDate || undefined,
        })
      });
      
      console.log("✅ תגובה מהשרת:", data);
      console.log("🔍 שומר tournamentId ב-store:", data.id);
      setTournamentId(data.id);
      
      // וידוא שה-ID נשמר
      setTimeout(() => {
        console.log("🔍 בדיקת tournamentId אחרי שמירה:", useStore.getState().tournamentId);
      }, 100);
      
      alert("✅ הטורניר נוצר בהצלחה!");
      
      // רענון רשימת הטורנירים
      await loadTournaments();
    } catch (error: any) {
      console.error("❌ שגיאה ביצירת הטורניר:", error);
      alert("❌ שגיאה ביצירת הטורניר: " + error.message);
    }
  }

  async function seedAndR16() {
    if (!tournamentId) return alert("צור טורניר קודם");
    if (selectedPlayers.length !== 16) return alert("יש לבחור בדיוק 16 שחקנים!");

    // אישור לפני יצירת השלב
    if (!confirm("האם אתה בטוח שברצונך ליצור את שלב שמינית הגמר?")) return;

    try {
      // שימוש במנגנון החדש לבחירת שחקנים עם הודעות
      const response = await api(`/api/tournament-registrations/${tournamentId}/select-players`, {
        method: "POST",
        body: JSON.stringify({
          selectedUserIds: selectedPlayers,
          tournamentTitle: title,
          tournamentDate: nextTournamentDate,
          prizeFirst: first,
          prizeSecond: second
        })
      });

      if (!response.ok) {
        throw new Error(response.data?.error || 'שגיאה בבחירת השחקנים');
      }

      // seeding אמיתי - סידור טורניר 16 קבוצות
      // סידור מסורתי: 1vs16, 2vs15, 3vs14, 4vs13, 5vs12, 6vs11, 7vs10, 8vs9
      const seededOrder = [
        selectedPlayers[0],  // #1
        selectedPlayers[15], // #16
        selectedPlayers[7],  // #8
        selectedPlayers[8],  // #9
        selectedPlayers[3],  // #4
        selectedPlayers[12], // #13
        selectedPlayers[4],  // #5
        selectedPlayers[11], // #12
        selectedPlayers[1],  // #2
        selectedPlayers[14], // #15
        selectedPlayers[6],  // #7
        selectedPlayers[9],  // #10
        selectedPlayers[2],  // #3
        selectedPlayers[13], // #14
        selectedPlayers[5],  // #6
        selectedPlayers[10]  // #11
      ];

      const players = seededOrder.map(id => {
        const player = availablePlayers.find(p => p.id === id)!;
        return {
          id: crypto.randomUUID(),
          psn: player.psn,
          displayName: player.displayName
        };
      });

      // יצירת המשחקים
      await api("/api/tournaments/seed", {
        method: "POST",
        body: JSON.stringify({ tournamentId, players })
      });
      
      setStagesActivated(prev => ({ ...prev, R16: true }));
      alert("✅ שלב שמינית הגמר נוצר בהצלחה! השחקנים קיבלו הודעות על בחירתם.");
    } catch (error) {
      console.error("שגיאה בבחירת שחקנים:", error);
      alert(`❌ שגיאה: ${error.message}`);
    }
  }

  async function advance(round: "R16" | "QF" | "SF") {
    if (!tournamentId) return;
    
    const stageNames = {
      R16: { from: "שמינית הגמר", to: "רבע גמר", key: "QF" },
      QF: { from: "רבע גמר", to: "חצי גמר", key: "SF" },
      SF: { from: "חצי גמר", to: "גמר", key: "F" }
    };
    
    const stage = stageNames[round];
    
    if (false) {
      return alert(`שלב ${stage.to} כבר הופעל!`);
    }
    
    // אישור לפני העלאת מנצחים
    if (!confirm(`האם אתה בטוח שברצונך להעלות את המנצחים מ${stage.from} ל${stage.to}?`)) return;
    
    await api(`/api/tournaments/${tournamentId}/advance/${round}`, { method: "POST" });
    
    setStagesActivated(prev => ({ ...prev, [stage.key]: true }));
    alert(`✅ המנצחים הועלו לשלב ${stage.to} בהצלחה!`);
  }

  function togglePlayer(playerId: string) {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      if (selectedPlayers.length >= 16) {
        alert("ניתן לבחור עד 16 שחקנים בלבד!");
        return;
      }
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  }

  function autoSelectFirst16() {
    // נבחר עד 16 שחקנים זמינים
    const maxPlayers = Math.min(16, availablePlayers.length);
    setSelectedPlayers(availablePlayers.slice(0, maxPlayers).map(p => p.id));
  }

  function clearPlayerSelection() {
    setSelectedPlayers([]);
  }

  // סינון שחקנים לפי חיפוש
  function getFilteredPlayers() {
    if (!playerSearchQuery.trim()) {
      return availablePlayers;
    }
    
    const query = playerSearchQuery.toLowerCase();
    return availablePlayers.filter(player => 
      player.psn.toLowerCase().includes(query) ||
      player.displayName.toLowerCase().includes(query) ||
      player.email.toLowerCase().includes(query)
    );
  }

  // מיקום השחקן ב-seeding
  function getPlayerSeed(playerId: string) {
    const index = selectedPlayers.indexOf(playerId);
    return index >= 0 ? index + 1 : null;
  }

  return (
    <div style={{ display: "grid", gap: 24, direction: "rtl" }}>
      {/* סטטוס נרשמים לטורניר */}
      <div style={{
        padding: 20,
        borderRadius: 16,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            🏆 סטטוס נרשמים לטורניר
          </h3>
          <button
            onClick={loadTournamentRegistrations}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            🔄 רענן
          </button>
        </div>
        
        {tournamentRegistrations.tournament ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                {tournamentRegistrations.totalRegistrations}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                נרשמים
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                {tournamentRegistrations.tournament.registrationCapacity || 100}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                מקסימום
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                {tournamentRegistrations.tournament.registrationMinPlayers || 16}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                מינימום
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 16, opacity: 0.9 }}>
            אין טורניר פעיל
          </div>
        )}
      </div>

      {/* כפתורי ניווט מהיר */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => {
            setShowUsersPanel(!showUsersPanel);
            setShowApprovalPanel(false);
          }}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: showUsersPanel 
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s"
          }}
        >
          {showUsersPanel ? "🎮 חזור לניהול טורניר" : "👥 ניהול משתמשים"}
        </button>
        
        {/* כפתור בקשות אישור - רק למנהל על */}
        {isSuperAdmin && (
          <button
            onClick={() => {
              setShowApprovalPanel(!showApprovalPanel);
              setShowUsersPanel(false);
              if (!showApprovalPanel) {
                loadPendingRequests();
              }
            }}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: showApprovalPanel
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s",
              position: "relative"
            }}
          >
            {showApprovalPanel ? "🎮 חזור לניהול טורניר" : "📋 בקשות אישור"}
            {pendingRequests.length > 0 && (
              <span style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "#f44336",
                color: "#fff",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(244, 67, 54, 0.5)"
              }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        )}
        
        <button
          onClick={() => {
            console.log("🔄 רענון ידני של משתמשים מחוברים...");
            checkOnlineUsers();
          }}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
            transition: "all 0.3s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          🔄 רענון סטטוס
        </button>
        
        <div style={{
          padding: "12px 20px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <span style={{ fontSize: 14, color: "#666" }}>סה"כ משתמשים:</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#667eea" }}>{users.length}</span>
        </div>
        
        <div style={{
          padding: "12px 20px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
          <span style={{ fontSize: 14, color: "#666" }}>משתמשים חסומים:</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#f44336" }}>
            {users.filter(u => u.status === "blocked").length}
          </span>
        </div>
        
        {/* כפתור רשימת טורנירים */}
        <button
          onClick={() => {
            if (existingTournaments.length === 0) {
              alert("אין טורנירים במערכת");
              return;
            }
            
            // יצירת רשימה של טורנירים לבחירה
            const tournamentList = existingTournaments.map((t, index) => 
              `${index + 1}. ${t.title} (${t.createdAt.split('T')[0]})`
            ).join('\n');
            
            const selection = prompt(`רשימת טורנירים (${existingTournaments.length}):\n\n${tournamentList}\n\nהזן מספר הטורניר שברצונך לבחור:`, "");
            
            if (selection && !isNaN(Number(selection))) {
              const index = Number(selection) - 1;
              if (index >= 0 && index < existingTournaments.length) {
                const selectedTournament = existingTournaments[index];
                setTournamentId(selectedTournament.id);
                alert(`✅ נבחר טורניר: "${selectedTournament.title}"`);
              } else {
                alert("מספר לא תקין");
              }
            }
          }}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(33, 150, 243, 0.4)",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(33, 150, 243, 0.6)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(33, 150, 243, 0.4)";
          }}
          title="בחירת טורניר מרשימה"
        >
          🏆 בחר טורניר ({existingTournaments.length})
        </button>

        {/* כפתור מחיקת טורניר - רק למנהל העל */}
        {isSuperAdmin && existingTournaments.length > 0 && tournamentId && (
          <button
            onClick={async () => {
              const selectedTournament = existingTournaments.find(t => t.id === tournamentId);
              if (!selectedTournament) {
                alert("טורניר לא נמצא");
                return;
              }
              
              if (!confirm(`⚠️ אתה עומד למחוק את הטורניר "${selectedTournament.title}"!\n\nפעולה זו תמחק גם את כל המשחקים וההגשות של הטורניר ולא ניתן לבטל אותה!\n\nהאם אתה בטוח שברצונך להמשיך?`)) {
                return;
              }
              
              // אישור נוסף למניעת מחיקה בטעות
              if (!confirm(`אישור סופי: למחוק את הטורניר "${selectedTournament.title}"?`)) {
                return;
              }
              
              try {
                await deleteTournament(tournamentId, selectedTournament.title);
                setTournamentId(""); // נקה את הבחירה
              } catch (error: any) {
                alert(`❌ שגיאה במחיקת הטורניר: ${error.message}`);
              }
            }}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(244, 67, 54, 0.4)",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(244, 67, 54, 0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.4)";
            }}
            title="מחיקת טורניר - פעולה זו זמינה רק למנהל העל"
          >
            🗑️ מחק טורניר נבחר
          </button>
        )}
        
        {/* הצגת הטורניר הנבחר */}
        {tournamentId && (
          <div style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 4px 15px rgba(76, 175, 80, 0.4)",
            color: "#fff"
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>טורניר נבחר:</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {existingTournaments.find(t => t.id === tournamentId)?.title || "לא ידוע"}
            </span>
          </div>
        )}
      </div>

      {/* פאנל בקשות אישור */}
      {showApprovalPanel && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#333", display: "flex", alignItems: "center", gap: 12 }}>
            <span>📋</span>
            בקשות אישור ממתינות ({pendingRequests.length})
          </h3>
          
          {pendingRequests.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: "#999"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>אין בקשות אישור ממתינות</div>
              <div style={{ fontSize: 14, marginTop: 8, opacity: 0.7 }}>כל הבקשות טופלו או עדיין לא נשלחו בקשות</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {pendingRequests.map((request) => (
                <div key={request.id} style={{
                  padding: 20,
                  borderRadius: 12,
                  border: "2px solid #ff9800",
                  backgroundColor: "#fff3e0",
                  boxShadow: "0 4px 12px rgba(255, 152, 0, 0.15)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e65100", marginBottom: 4 }}>
                        {request.actionType === "block" && "🚫 חסימת משתמש"}
                        {request.actionType === "unblock" && "✅ שחרור משתמש"}
                        {request.actionType === "reset-password" && "🔑 איפוס סיסמה"}
                        {request.actionType === "update-credit" && "💰 עדכון זיכוי"}
                        {request.actionType === "promote" && "👑 קידום למנהל"}
                        {request.actionType === "demote" && "⬇️ הורדה לשחקן"}
                        {request.actionType === "delete" && "🗑️ מחיקת משתמש"}
                        {request.actionType === "approve-user" && "👤 אישור משתמש חדש"}
                      </div>
                      <div style={{ fontSize: 14, color: "#666" }}>
                        על המשתמש: <strong>{request.targetUserEmail}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                        נשלח על ידי: {request.requesterEmail} • {new Date(request.createdAt).toLocaleString("he-IL")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => approveRequest(request.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "none",
                          background: "#4caf50",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        ✅ אשר
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "none",
                          background: "#f44336",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        ❌ דחה
                      </button>
                    </div>
                  </div>
                  
                  {request.actionData && Object.keys(request.actionData).length > 0 && (
                    <div style={{
                      padding: 12,
                      backgroundColor: "rgba(255, 152, 0, 0.1)",
                      borderRadius: 8,
                      marginTop: 12
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#e65100", marginBottom: 4 }}>
                        פרטים נוספים:
                      </div>
                      {request.actionData.newPassword && (
                        <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>
                          סיסמה חדשה: {request.actionData.newPassword}
                        </div>
                      )}
                      {request.actionData.credit !== undefined && (
                        <div style={{ fontSize: 11, color: "#666" }}>
                          סכום זיכוי: {request.actionData.credit} ₪
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* פאנל ניהול משתמשים */}
      {showUsersPanel && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#333", display: "flex", alignItems: "center", gap: 12 }}>
            <span>👥</span>
            ניהול משתמשים מתקדם
          </h3>
          
             {/* Presence Widget */}
             <div style={{
               border: "1px solid #eaeaea",
               padding: 16,
               borderRadius: 10,
               marginBottom: 20,
               backgroundColor: "#f9f9f9"
             }}>
               <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#333" }}>
                 🔴 מחוברים עכשיו ({presenceUsers.length})
               </h4>
               {presenceUsers.length === 0 && (
                 <div style={{ color: "#666", fontSize: 14 }}>אין משתמשים מחוברים כרגע</div>
               )}
               {presenceUsers.length > 0 && (
                 <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                   {presenceUsers.map(u => (
                     <li key={u.uid} style={{
                       display: "flex",
                       justifyContent: "space-between",
                       padding: "8px 0",
                       borderBottom: "1px dashed #eee"
                     }}>
                       <div>
                         <span style={{ fontWeight: 500 }}>{u.email}</span>
                         <div style={{ fontSize: 12, color: "#777" }}>
                           {(u as any).isActive ? "פעיל" : "לא פעיל"} · {(u as any).connections || 0} חיבורים
                         </div>
                       </div>
                       <span style={{ fontSize: 12, color: "#777" }}>
                         {new Date(u.lastSeen).toLocaleTimeString()}
                       </span>
                     </li>
                   ))}
                 </ul>
               )}
               <div style={{ fontSize: 12, color: "#777", marginTop: 8 }}>
                 משתמש נחשב "מחובר" אם התקבל heartbeat ב־60 השניות האחרונות
               </div>
             </div>
          
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
                      onClick={bulkApproveUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#28a745",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      ✅ אשר
                    </button>
                    
                    <button
                      onClick={bulkRejectUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#ffc107",
                        color: "#000",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      ❌ דחה
                    </button>
                    
                    <button
                      onClick={bulkPromoteUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#6f42c1",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      👑 הפוך למנהל
                    </button>
                    
                    <button
                      onClick={bulkDemoteUsers}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        border: "none",
                        background: "#fd7e14",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >
                      ⬇️ הפוך לשחקן
                    </button>
                    
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
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>תפקיד</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>זיכוי (₪)</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>תאריך הצטרפות</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>סטטוס חיבור</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>סטטוס אישור</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} style={{
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
                    <td style={{ padding: 12, fontWeight: 600 }}>{user.email}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
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
                          {user.role === "admin" ? (user.isSuperAdmin ? "מנהל על" : "מנהל") : "שחקן"}
                        </span>
                        {user.isSuperAdmin && (
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                            color: "#d84315",
                            border: "1px solid #ffa000"
                          }}>
                            👑 מנהל על
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#ff9800" }}>
                      {user.secondPrizeCredit > 0 ? `${user.secondPrizeCredit} ₪` : "-"}
                    </td>
                    <td style={{ padding: 12, textAlign: "center", color: "#666" }}>
                      {user.createdAt && !isNaN(new Date(user.createdAt).getTime()) 
                        ? new Date(user.createdAt).toLocaleDateString("he-IL") 
                        : "לא זמין"}
                    </td>
         <td style={{ padding: 12, textAlign: "center" }}>
           {(() => {
             const isOnline = onlineUsers.has(user.id);
             const isBlocked = user.status === "blocked";
             const isActive = user.status === "active";
             
             console.log(`👤 משתמש ${user.email}:`, {
               id: user.id,
               isOnline,
               isBlocked,
               isActive,
               status: user.status,
               onlineUsers: Array.from(onlineUsers)
             });

             if (isBlocked) {
               return (
                 <span style={{
                   padding: "4px 12px",
                   borderRadius: 20,
                   fontSize: 12,
                   fontWeight: 700,
                   background: "#f44336",
                   color: "#fff"
                 }}>
                   חסום ⛔
                 </span>
               );
             }

             // קביעת סטטוס לפי נתוני השרת (העדכניים ביותר)
             const shouldShowAsOnline = user.isOnline || false;
             const shouldShowAsActive = user.isActive || false;
             
             // Debug: נדפיס את המידע כדי לראות מה קורה
             console.log(`🔍 Debug user ${user.email}:`, {
               userId: user.id,
               userStatus: user.status,
               userData: user,
               shouldShowAsOnline: shouldShowAsOnline,
               shouldShowAsActive: shouldShowAsActive
             });
             
             // קביעת סטטוס וצבע לפי הנתונים מהשרת
             let statusText = "לא מחובר 📴";
             let statusColor = "#9e9e9e";
             
             console.log(`🎯 Status logic for ${user.email}:`, {
               shouldShowAsOnline,
               shouldShowAsActive,
               condition1: shouldShowAsOnline && shouldShowAsActive,
               condition2: shouldShowAsOnline && !shouldShowAsActive
             });
             
             if (shouldShowAsOnline && shouldShowAsActive) {
               statusText = "פעיל ✓";
               statusColor = "#4caf50";
               console.log(`✅ Setting ${user.email} to ACTIVE (green)`);
             } else if (shouldShowAsOnline && !shouldShowAsActive) {
               statusText = "מחובר 🔗";
               statusColor = "#2196F3";
               console.log(`🔗 Setting ${user.email} to CONNECTED (blue)`);
             } else {
               console.log(`📴 Setting ${user.email} to OFFLINE (gray)`);
             }
             
             return (
               <span style={{
                 padding: "4px 12px",
                 borderRadius: 20,
                 fontSize: 12,
                 fontWeight: 700,
                 background: statusColor,
                 color: "#fff"
               }}>
                 {statusText}
               </span>
             );
           })()}
         </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      {(() => {
                        const status = user.approvalStatus || 'approved';
                        if (status === 'pending') {
                          return (
                            <span style={{
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "#ff9800",
                              color: "#fff"
                            }}>
                              ⏳ ממתין לאישור
                            </span>
                          );
                        } else if (status === 'approved') {
                          return (
                            <span style={{
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "#4caf50",
                              color: "#fff"
                            }}>
                              ✅ מאושר
                            </span>
                          );
                        } else if (status === 'rejected') {
                          return (
                            <span style={{
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "#f44336",
                              color: "#fff"
                            }}>
                              ❌ נדחה
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td style={{ padding: 12 }}>
                      {/* אם זה מנהל על ואני לא מנהל על - הצג הודעה */}
                      {user.isSuperAdmin && !isSuperAdmin ? (
                        <div style={{
                          padding: "8px 16px",
                          background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#d84315",
                          textAlign: "center",
                          border: "2px solid #ffa000"
                        }}>
                          🔒 מנהל על - ללא הרשאות
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                          {user.status !== "blocked" ? (
                            <button
                              onClick={() => blockUser(user.id, user.email)}
                              disabled={user.role === "admin"}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "none",
                                background: user.role === "admin" ? "#ccc" : "#f44336",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: user.role === "admin" ? "not-allowed" : "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              🚫 חסום
                            </button>
                          ) : (
                            <button
                              onClick={() => unblockUser(user.id, user.email)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "none",
                                background: "#4caf50",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              ✓ שחרר
                            </button>
                          )}
                        <button
                          onClick={() => resetUserPassword(user.id, user.email)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#2196F3",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            opacity: isSuperAdmin ? 1 : 0.7
                          }}
                          title={!isSuperAdmin ? "ישלח בקשה למנהל על" : "איפוס סיסמה"}
                        >
                          🔑 סיסמה{!isSuperAdmin && " 🕐"}
                        </button>
                        <button
                          onClick={() => updateUserCredit(user.id, user.email, user.secondPrizeCredit)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: "#ff9800",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            opacity: isSuperAdmin ? 1 : 0.7
                          }}
                          title={!isSuperAdmin ? "ישלח בקשה למנהל על" : "עדכן זיכוי"}
                        >
                          💰 זיכוי{!isSuperAdmin && " 🕐"}
                        </button>
                        
                        {/* כפתורי אישור/דחייה למשתמשים ממתינים */}
                        {user.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => approveUser(user.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "none",
                                background: "#28a745",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              ✅ אשר
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                border: "none",
                                background: "#dc3545",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                              }}
                            >
                              ❌ דחה
                            </button>
                          </>
                        )}
                        
                        {/* כפתורי ניהול תפקידים */}
                        {user.role === "player" ? (
                          <button
                            onClick={() => promoteToAdmin(user.id, user.email)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#9c27b0",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              opacity: isSuperAdmin ? 1 : 0.7
                            }}
                            title={!isSuperAdmin ? "ישלח בקשה למנהל על" : "הפוך למנהל"}
                          >
                            👑 הפוך למנהל{!isSuperAdmin && " 🕐"}
                          </button>
                        ) : (
                          <button
                            onClick={() => demoteToPlayer(user.id, user.email)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              background: "#795548",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              opacity: isSuperAdmin ? 1 : 0.7
                            }}
                            title={!isSuperAdmin ? "ישלח בקשה למנהל על" : "הורד לשחקן"}
                          >
                            ⬇️ הורד לשחקן{!isSuperAdmin && " 🕐"}
                          </button>
                        )}
                        
                        {/* כפתור מחיקת משתמש - כולל מנהלים */}
                        <button
                          onClick={() => deleteUser(user.id, user.email, user.role)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: "none",
                            background: user.role === "admin" ? "#d32f2f" : "#e91e63",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            opacity: isSuperAdmin ? 1 : 0.7
                          }}
                          title={!isSuperAdmin ? "ישלח בקשה למנהל על" : (user.role === "admin" ? "מחק מנהל (זהירות!)" : "מחק משתמש")}
                        >
                          🗑️ מחק{!isSuperAdmin && " 🕐"}
                        </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: "#999"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>אין משתמשים עדיין</div>
            </div>
          )}
          
          {/* אינדיקטור מנהל על */}
          {isSuperAdmin && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              borderRadius: 12,
              border: "3px solid #ffa000",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{ fontSize: 32 }}>👑</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#d84315" }}>
                  אתה מנהל העל של המערכת
                </div>
                <div style={{ fontSize: 13, color: "#5d4037", marginTop: 4 }}>
                  יש לך הרשאות מלאות לכל הפעולות במערכת
                </div>
              </div>
            </div>
          )}
          
          {!isSuperAdmin && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              borderRadius: 12,
              border: "2px solid #2196F3",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{ fontSize: 24 }}>ℹ️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1976D2" }}>
                  אתה מנהל רגיל
                </div>
                <div style={{ fontSize: 12, color: "#1565C0", marginTop: 4 }}>
                  פעולות רגישות (זיכוי, סיסמה, תפקידים, מחיקה) דורשות הרשאת מנהל על
                </div>
              </div>
            </div>
          )}
          
          {/* הוספת מנהל חדש */}
          {isSuperAdmin && (
            <div style={{
              marginTop: 24,
              padding: 24,
              background: "linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)",
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(156, 39, 176, 0.3)"
            }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                marginBottom: 16, 
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <span>👑</span>
                הוספת מנהל חדש
              </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr auto", 
              gap: 12,
              alignItems: "end"
            }}>
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: "#fff",
                  marginBottom: 8,
                  opacity: 0.9
                }}>
                  📧 אימייל המנהל החדש
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "2px solid rgba(255,255,255,0.3)",
                    fontSize: 14,
                    backgroundColor: "rgba(255,255,255,0.95)"
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: "block", 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: "#fff",
                  marginBottom: 8,
                  opacity: 0.9
                }}>
                  🔑 סיסמה (לפחות 6 תווים)
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="סיסמה חזקה"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "2px solid rgba(255,255,255,0.3)",
                    fontSize: 14,
                    backgroundColor: "rgba(255,255,255,0.95)"
                  }}
                />
              </div>
              
              <button
                onClick={addNewAdmin}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#fff",
                  color: "#9c27b0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap"
                }}
              >
                ➕ הוסף מנהל
              </button>
            </div>
            
            <div style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8,
              fontSize: 13,
              color: "#fff",
              opacity: 0.9
            }}>
              💡 המנהל החדש יוכל להתחבר מיד עם האימייל והסיסמה שהוזנו
            </div>
            </div>
          )}
        </div>
      )}

      {/* ניהול טורניר - מוסתר כשפאנל המשתמשים פתוח */}
      {!showUsersPanel && (
        <>
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 24,
        borderRadius: 16,
        color: "#fff",
        boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)"
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span>⚙️</span>
          יצירת טורניר חדש
        </h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: 12 
        }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="כותרת הטורניר"
            style={{
              padding: 14,
              borderRadius: 10,
              border: "none",
              fontSize: 15,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
          />
          <select
            value={game}
            onChange={e => setGame(e.target.value as any)}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "none",
              fontSize: 15,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: "pointer"
            }}
          >
            <option>FC25</option>
            <option>FC26</option>
          </select>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
              פרס ראשון
            </label>
            <input
              type="number"
              value={first}
              onChange={e => setFirst(+e.target.value)}
              placeholder="1000"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "none",
                fontSize: 15,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
              פרס שני
            </label>
            <input
              type="number"
              value={second}
              onChange={e => setSecond(+e.target.value)}
              placeholder="500"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 10,
                border: "none",
                fontSize: 15,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ gridColumn: "span 2", position: "relative" }} data-datepicker>
            <div style={{
              display: "flex",
              gap: 8,
              alignItems: "center"
            }}>
              <input
                type="datetime-local"
                value={nextTournamentDate.includes("T") ? nextTournamentDate : ""}
                onChange={handleDateChange}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  fontSize: 15,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer"
                }}
              />
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "none",
                  fontSize: 18,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  color: "#667eea",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#667eea";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
                  e.currentTarget.style.color = "#667eea";
                }}
              >
                📅
              </button>
            </div>
            
            {/* תצוגת התאריך הנבחר */}
            {nextTournamentDate && (
              <div style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: 6,
                fontSize: 13,
                color: "#ffffff",
                fontWeight: 600,
                textAlign: "center"
              }}>
                📅 הטורניר הקרוב יערך ב {formatDateForDisplay(nextTournamentDate)}
              </div>
            )}

            {/* תאריכון מתקדם */}
            {showDatePicker && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: "#fff",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                border: "2px solid #667eea",
                marginTop: 8,
                padding: 16
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16
                }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#667eea",
                      marginBottom: 4
                    }}>
                      תאריך
                    </label>
                    <input
                      type="date"
                      value={nextTournamentDate.split("T")[0] || ""}
                      onChange={(e) => {
                        const time = nextTournamentDate.split("T")[1] || "20:00";
                        setNextTournamentDate(`${e.target.value}T${time}`);
                      }}
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "2px solid #e0e0e0",
                        borderRadius: 8,
                        fontSize: 14
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#667eea",
                      marginBottom: 4
                    }}>
                      שעה
                    </label>
                    <input
                      type="time"
                      value={nextTournamentDate.split("T")[1] || "20:00"}
                      onChange={(e) => {
                        const date = nextTournamentDate.split("T")[0] || new Date().toISOString().split("T")[0];
                        setNextTournamentDate(`${date}T${e.target.value}`);
                      }}
                      style={{
                        width: "100%",
                        padding: 10,
                        border: "2px solid #e0e0e0",
                        borderRadius: 8,
                        fontSize: 14
                      }}
                    />
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center"
                }}>
                  <button
                    onClick={() => {
                      const now = new Date();
                      now.setHours(20, 0, 0, 0); // 20:00 היום
                      setNextTournamentDate(formatDateForInput(now));
                      setShowDatePicker(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#4caf50",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    היום 20:00
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(20, 0, 0, 0);
                      setNextTournamentDate(formatDateForInput(tomorrow));
                      setShowDatePicker(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#2196F3",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    מחר 20:00
                  </button>
                  <button
                    onClick={() => {
                      setNextTournamentDate("");
                      setShowDatePicker(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#f44336",
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    נקה
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={createTournament}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "none",
              fontSize: 16,
              fontWeight: 700,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(245, 87, 108, 0.4)",
              transition: "all 0.3s",
              gridColumn: "span 2"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            ✨ צור טורניר
          </button>
        </div>
      </div>


      {/* הוספת קישור טלגרם לטורניר קיים */}
      {(() => {
        console.log("🔍 AdminDashboard - טורניר נוכחי:", tournamentId);
        console.log("🔍 AdminDashboard - טורנירים זמינים:", existingTournaments.length);
        return null;
      })()}
      {tournamentId && (
        <div style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          marginBottom: 24
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px 0", color: "#333" }}>
            💬 הוספת קישור טלגרם לטורניר
          </h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
                בחר טורניר לעדכון:
              </label>
              <button
                onClick={loadTournaments}
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
                🔄 רענן
              </button>
              {tournamentId && (
                <button
                  onClick={async () => {
                    console.log("🔍 מגדיר טורניר פעיל:", tournamentId);
                    setTournamentId(tournamentId);
                    console.log("🔍 אחרי הגדרה, tournamentId ב-store:", useStore.getState().tournamentId);
                    
                    // פתיחת הטורניר להרשמה
                    try {
                      const response = await api(`/api/tournament-registrations/${tournamentId}/admin/open`, {
                        method: 'POST',
                        body: JSON.stringify({
                          title: title,
                          capacity: 100,
                          min: 16
                        })
                      });
                      
                      if (response.ok) {
                        alert("✅ הטורניר הוגדר כפעיל ופתוח להרשמה!");
                      } else {
                        alert("❌ שגיאה בפתיחת הטורניר: " + (response.error || "שגיאה לא ידועה"));
                      }
                    } catch (error: any) {
                      console.error("שגיאה בפתיחת הטורניר:", error);
                      alert("❌ שגיאה בפתיחת הטורניר: " + error.message);
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
                    cursor: "pointer",
                    marginLeft: 8
                  }}
                >
                  ⭐ הגדר כפעיל ופתח להרשמה
                </button>
              )}
              {tournamentId && (
                <button
                  onClick={async () => {
                    try {
                      const response = await api(`/api/tournament-registrations/${tournamentId}/admin/close`, {
                        method: 'POST'
                      });
                      
                      if (response.ok) {
                        alert("✅ הטורניר נסגר להרשמה!");
                      } else {
                        alert("❌ שגיאה בסגירת הטורניר: " + (response.error || "שגיאה לא ידועה"));
                      }
                    } catch (error: any) {
                      console.error("שגיאה בסגירת הטורניר:", error);
                      alert("❌ שגיאה בסגירת הטורניר: " + error.message);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#f44336",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginLeft: 8
                  }}
                >
                  🔒 סגור להרשמה
                </button>
              )}
            </div>
            <select
              value={tournamentId || ""}
              onChange={(e) => setTournamentId(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "2px solid #e0e0e0",
                fontSize: 14,
                backgroundColor: "#fff"
              }}
            >
              <option value="">-- בחר טורניר --</option>
              {existingTournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.title} ({tournament.createdAt.split('T')[0]}) 
                </option>
              ))}
            </select>
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: "#f5f5f5",
              borderRadius: 6,
              fontSize: 12,
              color: "#666"
            }}>
              📊 סה"כ טורנירים: <strong>{existingTournaments.length}</strong>
              {tournamentId && (
                <> | 🔍 ID נבחר: <strong>{tournamentId}</strong></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ניהול קישור טלגרם כללי */}

      <div style={{
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#333" }}>
            👥 בחירת שחקנים ({selectedPlayers.length}/16)
          </h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={autoSelectFirst16}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(67, 233, 123, 0.3)"
              }}
            >
              ✓ בחר הכל
            </button>
            <button
              onClick={clearPlayerSelection}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(250, 112, 154, 0.3)"
              }}
            >
              ✕ נקה
            </button>
          </div>
        </div>

        <div style={{
          padding: 16,
          background: "#e3f2fd",
          borderRadius: 10,
          marginBottom: 16,
          border: "2px solid #2196F3"
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1976D2", marginBottom: 8 }}>
            💡 Seeding טורניר אמיתי
          </div>
          <div style={{ fontSize: 13, color: "#1565C0", lineHeight: 1.6 }}>
            השחקנים שתבחר יסודרו לפי הסדר הבחירה:<br />
            מקום 1 נגד 16, מקום 2 נגד 15, מקום 3 נגד 14... (כמו בטורניר מקצועי)
          </div>
        </div>

        {/* שדה חיפוש */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 חפש לפי שם PS5 או מייל..."
            value={playerSearchQuery}
            onChange={(e) => setPlayerSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 15,
              borderRadius: 10,
              border: "2px solid #e0e0e0",
              outline: "none",
              transition: "border-color 0.3s",
              fontFamily: "inherit"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
          />
          {playerSearchQuery && (
            <div style={{
              marginTop: 8,
              fontSize: 13,
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>נמצאו {getFilteredPlayers().length} שחקנים</span>
              <button
                onClick={() => setPlayerSearchQuery("")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                נקה חיפוש
              </button>
            </div>
          )}
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
          gap: 12 
        }}>
          {getFilteredPlayers().map((player) => {
            const isSelected = selectedPlayers.includes(player.id);
            const seed = getPlayerSeed(player.id);

            return (
              <div
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: isSelected ? "3px solid #667eea" : "2px solid #f0f0f0",
                  background: isSelected
                    ? "linear-gradient(135deg, #e8eaf6 0%, #fff 100%)"
                    : "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  position: "relative",
                  boxShadow: isSelected ? "0 4px 12px rgba(102, 126, 234, 0.2)" : "none"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isSelected ? "0 4px 12px rgba(102, 126, 234, 0.2)" : "none";
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.4)"
                  }}>
                    #{seed}
                  </div>
                )}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isSelected ? "#667eea" : "#999",
                  marginBottom: 6,
                  textAlign: "right"
                }}>
                  {isSelected ? "✓ נבחר" : "לחץ לבחירה"}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#333",
                  marginBottom: 4
                }}>
                  {player.displayName}
                </div>
                <div style={{
                  fontSize: 12,
                  color: "#666",
                  fontFamily: "monospace",
                  marginBottom: 2
                }}>
                  PSN: {player.psn}
                </div>
                <div style={{
                  fontSize: 11,
                  color: "#888",
                  fontFamily: "monospace",
                  marginBottom: 8
                }}>
                  {player.email}
                </div>
                
                {/* אינדיקטור מחובר/לא מחובר */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: player.isOnline ? "#28a745" : "#6c757d",
                  background: player.isOnline ? "#d4edda" : "#e9ecef",
                  padding: "4px 8px",
                  borderRadius: 12,
                  justifyContent: "center"
                }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: player.isOnline ? "#28a745" : "#6c757d"
                  }} />
                  {player.isOnline ? "מחובר" : "לא מחובר"}
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* פאנל ניהול הרשמות לטורניר */}
      {tournamentId && (
        <div style={{ marginBottom: 24 }}>
          <TournamentRegistrationsPanel tournamentId={tournamentId} />
        </div>
      )}

      {/* פאנל בחירת שחקנים לטורניר */}
      {tournamentId && (
        <div style={{ marginBottom: 24 }}>
          <PlayerSelectionPanel 
            tournamentId={tournamentId} 
            onSelectionComplete={(count) => {
              console.log(`Selected ${count} players for tournament`);
              // אפשר להוסיף כאן לוגיקה נוספת אחרי בחירת השחקנים
            }}
          />
        </div>
      )}

        </>
      )}
    </div>
  );
}
