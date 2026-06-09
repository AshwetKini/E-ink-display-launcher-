// src/hooks/useBattery.ts
import { useState, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

interface BatteryState {
  level: number;      // 0-100
  charging: boolean;
  icon: string;       // text-based battery indicator
}

export const useBattery = (): BatteryState => {
  const [battery, setBattery] = useState<BatteryState>({
    level: 100,
    charging: false,
    icon: '▓▓▓▓▓',
  });

  const getBatteryIcon = (level: number, charging: boolean): string => {
    if (charging) return '⚡';
    if (level > 80) return '▓▓▓▓▓';
    if (level > 60) return '▓▓▓▓░';
    if (level > 40) return '▓▓▓░░';
    if (level > 20) return '▓▓░░░';
    if (level > 10) return '▓░░░░';
    return '░░░░░';
  };

  useEffect(() => {
    const fetchBattery = async () => {
      try {
        const level = await DeviceInfo.getBatteryLevel();
        const charging = await DeviceInfo.isBatteryCharging();
        const pct = Math.round(level * 100);
        setBattery({
          level: pct,
          charging,
          icon: getBatteryIcon(pct, charging),
        });
      } catch {
        // Gracefully fail
      }
    };

    fetchBattery();
    const interval = setInterval(fetchBattery, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  return battery;
};
