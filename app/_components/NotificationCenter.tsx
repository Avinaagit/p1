'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  surveyId?: string;
  survey?: {
    id: string;
    title: string;
  };
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const fetchNotifications = async () => {
    try {
      const url = showUnreadOnly 
        ? '/api/v1/notifications?unreadOnly=true' 
        : '/api/v1/notifications';
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST',
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.surveyId) {
      router.push(`/surveys/${notification.surveyId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SURVEY_REMINDER':
        return '📊';
      case 'SURVEY_DEADLINE':
        return '⏰';
      case 'SURVEY_INVITATION':
        return '📧';
      case 'TASK_ASSIGNED':
        return '📋';
      case 'TASK_DEADLINE':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Дөнгөж сая';
    if (diffMins < 60) return `${diffMins} минутын өмнө`;
    if (diffHours < 24) return `${diffHours} цагийн өмнө`;
    if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
    return date.toLocaleDateString('mn-MN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">⏳ Мэдэгдэл ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            🔔 Мэдэгдэл
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Бүгдийг унших
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnreadOnly(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !showUnreadOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Бүгд
          </button>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showUnreadOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Уншаагүй
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Мэдэгдэл байхгүй байна</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-gray-900 ${
                      !notification.isRead ? 'font-bold' : ''
                    }`}>
                      {notification.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Устгах"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  {notification.survey && (
                    <p className="text-xs text-blue-600 mt-1">
                      📊 {notification.survey.title}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Шинэ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
