import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { waterService } from '../services/waterService';

const WaterReminderContext = createContext(null);

export const WaterReminderProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showInfo, showSuccess } = useNotification();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const timerRef = useRef(null);
  const lastReminderTimeRef = useRef(0);

  // Check initial browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      showInfo('Browser notifications are not supported on this browser. In-app alerts will be used instead.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showSuccess('Hydration notifications enabled!');
        return true;
      } else {
        showInfo('Notifications blocked. FitTrack will show in-app reminders while the app is open.');
        return false;
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  };

  const triggerReminder = async () => {
    const prefs = user?.reminderPreferences || {
      enabled: true,
      intervalMinutes: 120,
      wakingHourStart: 8,
      wakingHourEnd: 22,
    };

    if (!prefs.enabled) return;

    // Check waking hours
    const currentHour = new Date().getHours();
    if (currentHour < prefs.wakingHourStart || currentHour >= prefs.wakingHourEnd) {
      // Quiet hours, do not disturb
      return;
    }

    // Prevent duplicate reminders within 10 minutes
    const now = Date.now();
    if (now - lastReminderTimeRef.current < 10 * 60 * 1000) {
      return;
    }
    lastReminderTimeRef.current = now;

    const title = '💧 Hydration Check — FitTrack';
    const message = 'Time to drink some water! Stay hydrated to keep your energy and metabolism peak.';

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'fittrack-water-reminder',
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (err) {
        showInfo(`${title}: ${message}`);
      }
    } else {
      // In-app fallback
      showInfo(`💧 Hydration Reminder: Time to drink a glass of water!`);
    }
  };

  // Schedule reminder timer based on user interval
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const prefs = user.reminderPreferences || {
      enabled: true,
      intervalMinutes: 120,
      wakingHourStart: 8,
      wakingHourEnd: 22,
    };

    if (!prefs.enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(15, prefs.intervalMinutes || 120) * 60 * 1000;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      triggerReminder();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, isAuthenticated]);

  const quickLogWater = async (amountMl = 250) => {
    try {
      await waterService.logWater(amountMl);
      showSuccess(`Logged +${amountMl} ml of water!`);
    } catch (e) {
      console.error('Failed to log water:', e);
    }
  };

  return (
    <WaterReminderContext.Provider
      value={{
        notificationPermission,
        requestPermission,
        triggerReminder,
        quickLogWater,
      }}
    >
      {children}
    </WaterReminderContext.Provider>
  );
};

export const useWaterReminder = () => {
  const context = useContext(WaterReminderContext);
  if (!context) {
    throw new Error('useWaterReminder must be used within a WaterReminderProvider');
  }
  return context;
};
