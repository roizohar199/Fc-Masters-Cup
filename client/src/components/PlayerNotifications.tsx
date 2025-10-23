import React, { useEffect, useState } from "react";
import { api } from "../api";

interface PlayerNotificationsProps {
  isMobile: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: number;
  createdAt: string;
}

export function PlayerNotifications({ isMobile }: PlayerNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // רענון אוטומטי כל 30 שניות כדי לזהות הודעות שנמחקו
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    // האזנה להודעות WebSocket
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "tournament:deleted") {
          console.log("🏆 Received tournament deletion notification:", data);
          // רענון מיידי של ההודעות
          loadNotifications();
        }
      } catch (error) {
        // התעלמות מהודעות שאינן JSON
      }
    };
    
    // חיבור ל-WebSocket אם זמין
    if (window.WebSocket) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/presence`;
      
      try {
        const ws = new WebSocket(wsUrl);
        ws.onmessage = handleWebSocketMessage;
        ws.onerror = () => {
          // אם WebSocket נכשל, נמשיך עם polling
          console.log("WebSocket connection failed, using polling fallback");
        };
        
        return () => {
          clearInterval(interval);
          ws.close();
        };
      } catch (error) {
        console.log("WebSocket not available, using polling fallback");
      }
    }
    
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const result = await api("/api/tournament-registrations/notifications");
      if (result.ok) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await api(`/api/tournament-registrations/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      // עדכון מקומי
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }


  if (loading) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: "#fff",
      padding: isMobile ? 16 : 20,
      borderRadius: isMobile ? 12 : 16,
      border: "2px solid #e0e0e0",
      marginBottom: isMobile ? 16 : 24,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: isMobile ? 12 : 16
      }}>
        <h3 style={{
          fontSize: isMobile ? 16 : 20,
          fontWeight: 700,
          color: "#333",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          🔔 הודעות
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: "#f44336",
              color: "#fff",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: isMobile ? 10 : 12,
              fontWeight: 700
            }}>
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: isMobile ? 12 : 16,
              borderRadius: 8,
              backgroundColor: notification.isRead ? "#f8f9fa" : "#e3f2fd",
              border: notification.isRead ? "1px solid #e0e0e0" : "2px solid #2196f3",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => {
              if (!notification.isRead) {
                markAsRead(notification.id);
              }
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12
            }}>
              <div style={{
                fontSize: isMobile ? 20 : 24,
                marginTop: 2
              }}>
                {notification.type === 'tournament_selection' ? '🎯' : '📢'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700,
                  color: "#333",
                  margin: "0 0 4px 0"
                }}>
                  {notification.title}
                </h4>
                <p style={{
                  fontSize: isMobile ? 12 : 14,
                  color: "#666",
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {notification.message}
                </p>
                {notification.data && (
                  <div style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    borderRadius: 6,
                    fontSize: isMobile ? 11 : 12,
                    color: "#1976d2"
                  }}>
                    {notification.data.tournamentDate && (
                      <div>📅 תאריך: {new Date(notification.data.tournamentDate).toLocaleDateString('he-IL')}</div>
                    )}
                    {notification.data.telegramLink && (
                      <div>📱 קבוצת טלגרם זמינה</div>
                    )}
                    {notification.data.prizeFirst && (
                      <div>🏆 פרס ראשון: {notification.data.prizeFirst} ₪</div>
                    )}
                  </div>
                )}
              </div>
              {!notification.isRead && (
                <div style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#2196f3",
                  borderRadius: "50%",
                  marginTop: 4
                }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 3 && (
        <div style={{
          textAlign: "center",
          marginTop: 12,
          fontSize: isMobile ? 12 : 14,
          color: "#666"
        }}>
          ועוד {notifications.length - 3} הודעות...
        </div>
      )}
    </div>
  );
}
