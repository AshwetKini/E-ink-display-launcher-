// src/hooks/useClock.ts
import { useState, useEffect } from 'react';
import { useStore } from '../store';

interface ClockData {
  hours: string;
  minutes: string;
  seconds: string;
  ampm: string;
  dayOfWeek: string;
  date: string;
  month: string;
  year: string;
  greeting: string;
  rawDate: Date;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getGreeting = (hour: number): string => {
  if (hour < 5) return 'Still night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 20) return 'Good evening';
  return 'Good night';
};

export const useClock = (): ClockData => {
  const clockFormat = useStore(s => s.settings.clockFormat);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every second but efficiently
    const tick = () => {
      setNow(new Date());
    };
    // Align to next second
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }, msToNextSecond);

    return () => clearTimeout(timeout);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const is12 = clockFormat === '12';
  const displayHour = is12 ? (h % 12 || 12) : h;
  const ampm = is12 ? (h >= 12 ? 'PM' : 'AM') : '';

  return {
    hours: String(displayHour).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
    ampm,
    dayOfWeek: DAYS[now.getDay()],
    date: String(now.getDate()),
    month: MONTHS[now.getMonth()],
    year: String(now.getFullYear()),
    greeting: getGreeting(h),
    rawDate: now,
  };
};
