import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../api';
import { apiUrl } from '../../config/api';
import { usePresence } from '../../hooks/usePresence';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface User {
  id: string;
  email: string;
  psnUsername?: string;
  role: string;
  status: string;
  isOnline?: boolean;
}

interface PlayerSelectionPanelProps {
  tournamentId: string;
  onSelectionComplete?: (selectedCount: number) => void;
}

export function PlayerSelectionPanel({ tournamentId, onSelectionComplete }: PlayerSelectionPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [tournamentDetails, setTournamentDetails] = useState({
    title: '',
    date: '',
    prizeFirst: 500,
    prizeSecond: 0
  });
  const [selectedStage, setSelectedStage] = useState<'R16' | 'QF' | 'SF' | 'F'>('R16');
  const [sendEmails, setSendEmails] = useState(true);
  const [createNotifications, setCreateNotifications] = useState(true);

  // Get current user ID from auth context (you'll need to implement this)
  const currentUserId = "current-user-id"; // TODO: Get from auth context

  // Presence tracking with unique session ID
  usePresence({ 
    userId: currentUserId, 
    tournamentId, 
    sessionId: crypto.randomUUID(), // Unique session per component mount
    enabled: !!tournamentId 
  });

  // Online status polling
  const { isUserOnline, onlineStatus } = useOnlineStatus({ 
    pollInterval: 10000, // Poll every 10 seconds
    enabled: !!tournamentId 
  });

  useEffect(() => {
    if (tournamentId) {
      loadUsers();
      loadTournamentDetails();
    }
  }, [tournamentId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // טען שחקנים מהנקודת קצה החדשה
      const response = await api(apiUrl('/admin/players'));
      if (response.ok) {
        const players = response.data?.players || [];
        setUsers(players);
      } else {
        console.error('Failed to load players:', response);
        toast.error('שגיאה בטעינת רשימת השחקנים');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('שגיאה בטעינת רשימת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async () => {
    try {
      const response = await api(apiUrl(`/tournaments/${tournamentId}`));
      if (response.ok) {
        const tournament = response.data;
        setTournamentDetails({
          title: tournament.title || 'טורניר FC Masters Cup',
          date: tournament.nextTournamentDate || '',
          prizeFirst: tournament.prizeFirst || 500,
          prizeSecond: tournament.prizeSecond || 0
        });
      }
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    // סינון לפי חיפוש
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.psnUsername && user.psnUsername.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // סינון לפי סטטוס מחובר
    const matchesOnlineFilter = 
      onlineFilter === 'all' ? true :
      onlineFilter === 'online' ? user.isOnline === true :
      user.isOnline !== true;
    
    return matchesSearch && matchesOnlineFilter;
  });

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else if (prev.length < 16) {
        return [...prev, userId];
      } else {
        toast.error('ניתן לבחור עד 16 שחקנים בלבד');
        return prev;
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === Math.min(16, filteredUsers.length)) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.slice(0, 16).map(u => u.id));
    }
  };

  const handleSubmitSelection = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('יש לבחור לפחות שחקן אחד');
      return;
    }

    if (selectedUserIds.length > 16) {
      toast.error('ניתן לבחור עד 16 שחקנים בלבד');
      return;
    }



    try {
      setSelecting(true);
      const response = await api(`/api/admin/tournaments/${tournamentId}/select`, {
        method: 'POST',
        body: JSON.stringify({
          stage: selectedStage,
          slots: selectedUserIds.length,
          notifyEmail: sendEmails,
          notifyHomepage: createNotifications,
          selectedUserIds: selectedUserIds
        })
      });

      if (response.ok) {
        toast.success(`נבחרו ${selectedUserIds.length} שחקנים לטורניר!`);
        setSelectedUserIds([]);
        if (onSelectionComplete) {
          onSelectionComplete(selectedUserIds.length);
        }
      } else {
        toast.error(response.data?.error || 'שגיאה בבחירת השחקנים');
      }
    } catch (error) {
      console.error('Failed to select players:', error);
      toast.error('שגיאה בבחירת השחקנים');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>טוען רשימת משתמשים...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        🎯 בחירת שחקנים לטורניר
      </h3>

      {/* פרטי הטורניר */}
      <div style={{
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>
          פרטי הטורניר:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
              שם הטורניר:
            </label>
            <input
              type="text"
              value={tournamentDetails.title}
              onChange={(e) => setTournamentDetails(prev => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
              תאריך הטורניר:
            </label>
            <input
              type="datetime-local"
              value={tournamentDetails.date}
              onChange={(e) => setTournamentDetails(prev => ({ ...prev, date: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
              פרס ראשון (₪):
            </label>
            <input
              type="number"
              value={tournamentDetails.prizeFirst}
              onChange={(e) => setTournamentDetails(prev => ({ ...prev, prizeFirst: parseInt(e.target.value) || 0 }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginBottom: '4px' }}>
              פרס שני (₪):
            </label>
            <input
              type="number"
              value={tournamentDetails.prizeSecond}
              onChange={(e) => setTournamentDetails(prev => ({ ...prev, prizeSecond: parseInt(e.target.value) || 0 }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* חיפוש וסינון */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="חיפוש לפי אימייל או שם PSN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            marginBottom: '12px'
          }}
        />
        
        {/* כפתורי סינון */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => setOnlineFilter('all')}
            style={{
              padding: '6px 16px',
              border: onlineFilter === 'all' ? '2px solid #007bff' : '1px solid #ddd',
              borderRadius: '6px',
              background: onlineFilter === 'all' ? '#e3f2fd' : 'white',
              color: onlineFilter === 'all' ? '#007bff' : '#495057',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            כולם ({users.length})
          </button>
          <button
            onClick={() => setOnlineFilter('online')}
            style={{
              padding: '6px 16px',
              border: onlineFilter === 'online' ? '2px solid #28a745' : '1px solid #ddd',
              borderRadius: '6px',
              background: onlineFilter === 'online' ? '#d4edda' : 'white',
              color: onlineFilter === 'online' ? '#28a745' : '#495057',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#28a745'
            }} />
            מחוברים ({users.filter(u => u.isOnline).length})
          </button>
          <button
            onClick={() => setOnlineFilter('offline')}
            style={{
              padding: '6px 16px',
              border: onlineFilter === 'offline' ? '2px solid #6c757d' : '1px solid #ddd',
              borderRadius: '6px',
              background: onlineFilter === 'offline' ? '#e9ecef' : 'white',
              color: onlineFilter === 'offline' ? '#495057' : '#6c757d',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#6c757d'
            }} />
            לא מחוברים ({users.filter(u => !u.isOnline).length})
          </button>
        </div>
      </div>

      {/* בחירת שלב ואפשרויות */}
      <div style={{
        background: '#e3f2fd',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #bbdefb'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1976d2' }}>
          הגדרות בחירה:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#1976d2', display: 'block', marginBottom: '4px' }}>
              שלב הטורניר:
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as 'R16' | 'QF' | 'SF' | 'F')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #1976d2',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="R16">שמינית גמר (16 שחקנים)</option>
              <option value="QF">רבע גמר (8 שחקנים)</option>
              <option value="SF">חצי גמר (4 שחקנים)</option>
              <option value="F">גמר (2 שחקנים)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              שליחת מייל לנבחרים
            </label>
            <label style={{ fontSize: '12px', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={createNotifications}
                onChange={(e) => setCreateNotifications(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              יצירת התראה בעמוד הבית
            </label>
          </div>
        </div>
      </div>

      {/* כפתורי פעולה */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSelectAll}
          style={{
            padding: '8px 16px',
            background: selectedUserIds.length === Math.min(16, filteredUsers.length) ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {selectedUserIds.length === Math.min(16, filteredUsers.length) ? 'בטל הכל' : 'בחר הכל'}
        </button>
        <div style={{
          padding: '8px 16px',
          background: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#495057',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>נבחרו: {selectedUserIds.length}/16</span>
        </div>
      </div>

      {/* רשימת משתמשים */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        background: '#f8f9fa'
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            לא נמצאו משתמשים
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserToggle(user.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e9ecef',
                cursor: 'pointer',
                background: selectedUserIds.includes(user.id) ? '#e3f2fd' : 'white',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (!selectedUserIds.includes(user.id)) {
                  e.currentTarget.style.background = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedUserIds.includes(user.id)) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedUserIds.includes(user.id)}
                onChange={() => handleUserToggle(user.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '2px'
                }}>
                  {user.psnUsername || user.email}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  {user.email}
                </div>
              </div>
              
              {/* אינדיקטור מחובר/לא מחובר */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: isUserOnline(user.id) ? '#28a745' : '#6c757d',
                background: isUserOnline(user.id) ? '#d4edda' : '#e9ecef',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isUserOnline(user.id) ? '#28a745' : '#6c757d',
                  animation: isUserOnline(user.id) ? 'pulse 2s infinite' : 'none'
                }} />
                {isUserOnline(user.id) ? 'מחובר' : 'לא מחובר'}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#28a745',
                background: '#d4edda',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600'
              }}>
                {user.role}
              </div>
            </div>
          ))
        )}
      </div>

      {/* כפתור שליחה */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <button
          onClick={handleSubmitSelection}
          disabled={selectedUserIds.length === 0 || selecting}
          style={{
            padding: '12px 32px',
            background: selectedUserIds.length === 0 || selecting ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedUserIds.length === 0 || selecting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            minWidth: '200px'
          }}
        >
          {selecting ? 'שולח הודעות...' : `שלח הודעות ל-${selectedUserIds.length} שחקנים`}
        </button>
      </div>

      {/* הודעה חשובה */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#856404'
      }}>
        <strong>⚠️ חשוב לדעת:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingRight: '20px' }}>
          <li>כל שחקן שנבחר יקבל הודעה בדף הבית ובמייל</li>
          <li>הטורניר יעבור אוטומטית למצב "running"</li>
          <li>ניתן לבחור עד 16 שחקנים בלבד</li>
          <li>הפעולה לא ניתנת לביטול</li>
        </ul>
      </div>
    </div>
    </>
  );
}
