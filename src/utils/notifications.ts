// src/utils/notifications.ts
import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';

export const initNotifications = () => {
  PushNotification.configure({
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Create channel for Android
  PushNotification.createChannel(
    {
      channelId: 'eink-reminders',
      channelName: 'Reminders',
      channelDescription: 'Gentle reminders from your e-ink launcher',
      importance: Importance.HIGH,
      vibrate: false, // minimal — keep it calm
      soundName: 'default',
    },
    (created) => console.log(`Channel created: ${created}`)
  );
};

export const scheduleReminder = (
  id: string,
  title: string,
  message: string,
  date: Date,
  repeatType?: 'day' | 'week'
): string => {
  const notifId = `reminder_${id}`;

  PushNotification.localNotificationSchedule({
    channelId: 'eink-reminders',
    id: notifId,
    title,
    message: message || 'Reminder',
    date,
    repeatType,
    allowWhileIdle: true,
    vibrate: false,
    playSound: true,
    soundName: 'default',
    smallIcon: 'ic_notification',
    largeIconUrl: undefined,
    // Android specific
    bigText: message,
    subText: 'E-Ink Launcher',
    priority: 'high',
    visibility: 'public',
  });

  return notifId;
};

export const cancelReminder = (notificationId: string) => {
  PushNotification.cancelLocalNotification(notificationId);
};

export const cancelAllReminders = () => {
  PushNotification.cancelAllLocalNotifications();
};

export const formatReminderTime = (datetime: number): string => {
  const d = new Date(datetime);
  const now = new Date();
  const diffMs = datetime - Date.now();
  const diffHrs = diffMs / 3600000;
  const diffDays = diffMs / 86400000;

  if (diffMs < 0) return 'Past';
  if (diffHrs < 1) return `in ${Math.round(diffMs / 60000)}m`;
  if (diffHrs < 24) return `in ${Math.round(diffHrs)}h`;
  if (diffDays < 2) return 'Tomorrow';
  if (diffDays < 7) {
    return d.toLocaleDateString('en', { weekday: 'short' });
  }
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
};
