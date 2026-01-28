'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications?unreadOnly=true');
      const data = await res.json();

      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
        setRecentNotifications((data.data || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}`, {
        method: 'PATCH',
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setShowDropdown(false);

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
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Мэдэгдэл</h3>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {unreadCount} шинэ
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">Шинэ мэдэгдэл байхгүй</p>
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Шинэ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/notifications');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Бүх мэдэгдэл харах →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
