import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: number;
  createdAt: string;
}

interface NotificationBannerProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationBanner({ onNotificationClick }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tournament-registrations/notifications?limit=5');
      if (response.ok) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await api.put(`/tournament-registrations/notifications/${notificationId}/read`);
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.isRead === 0) {
      markAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (loading) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  const unreadNotifications = notifications.filter(n => n.isRead === 0);
  const displayNotifications = showAll ? notifications : unreadNotifications;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1000,
      maxWidth: '400px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e0e0e0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            הודעות ({unreadCount})
          </span>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {showAll ? 'הסתר' : 'הצג הכל'}
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              background: notification.isRead === 0 ? '#f8f9ff' : 'white',
              transition: 'background-color 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = notification.isRead === 0 ? '#e8f0ff' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = notification.isRead === 0 ? '#f8f9ff' : 'white';
            }}
          >
            {/* Unread indicator */}
            {notification.isRead === 0 && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                background: '#667eea',
                borderRadius: '50%'
              }} />
            )}

            <div style={{ marginRight: notification.isRead === 0 ? '16px' : '0' }}>
              <h4 style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                lineHeight: '1.4'
              }}>
                {notification.title}
              </h4>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '13px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                {notification.message}
              </p>
              <div style={{
                fontSize: '11px',
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>🕒</span>
                <span>{new Date(notification.createdAt).toLocaleString('he-IL')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '8px 16px',
          background: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <button
            onClick={loadNotifications}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            רענן הודעות
          </button>
        </div>
      )}
    </div>
  );
}
