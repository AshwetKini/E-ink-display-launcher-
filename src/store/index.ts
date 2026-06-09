// src/store/index.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  createdAt: number;
  doneAt?: number;
  dueDate?: number;
}

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  datetime: number;
  recurring: 'none' | 'daily' | 'weekly';
  notificationId?: string;
  done: boolean;
}

export interface UsageDay {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
  lastOpen: number;
}

export interface AppSettings {
  showSeconds: boolean;
  showBattery: boolean;
  dailyGoalMinutes: number;
  greetingName: string;
  showUsageBar: boolean;
  clockFormat: '12' | '24';
  focusModeEnabled: boolean;
  focusModeMessage: string;
}

interface LauncherStore {
  // Todos
  todos: Todo[];
  addTodo: (text: string, priority?: Priority, dueDate?: number) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, text: string, priority: Priority, dueDate?: number) => void;
  clearDone: () => void;

  // Reminders
  reminders: Reminder[];
  addReminder: (title: string, datetime: number, note?: string, recurring?: Reminder['recurring']) => void;
  deleteReminder: (id: string) => void;
  editReminder: (id: string, updates: Partial<Reminder>) => void;
  markReminderDone: (id: string) => void;

  // Usage tracking
  usage: UsageDay[];
  recordSession: (minutes: number) => void;
  getTodayUsage: () => UsageDay | null;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Persistence
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  _sessionStart: number | null;
  startSession: () => void;
  endSession: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  showSeconds: false,
  showBattery: true,
  dailyGoalMinutes: 60,
  greetingName: '',
  showUsageBar: true,
  clockFormat: '12',
  focusModeEnabled: false,
  focusModeMessage: 'Put the phone down. Be present.',
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

export const useStore = create<LauncherStore>((set, get) => ({
  todos: [],
  reminders: [],
  usage: [],
  settings: DEFAULT_SETTINGS,
  _sessionStart: null,

  // ─── TODOS ────────────────────────────────────────
  addTodo: (text, priority = 'medium', dueDate) => {
    const todo: Todo = {
      id: genId(),
      text: text.trim(),
      done: false,
      priority,
      createdAt: Date.now(),
      dueDate,
    };
    set(s => ({ todos: [todo, ...s.todos] }));
    get().saveData();
  },

  toggleTodo: (id) => {
    set(s => ({
      todos: s.todos.map(t =>
        t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : undefined } : t
      ),
    }));
    get().saveData();
  },

  deleteTodo: (id) => {
    set(s => ({ todos: s.todos.filter(t => t.id !== id) }));
    get().saveData();
  },

  editTodo: (id, text, priority, dueDate) => {
    set(s => ({
      todos: s.todos.map(t => t.id === id ? { ...t, text, priority, dueDate } : t),
    }));
    get().saveData();
  },

  clearDone: () => {
    set(s => ({ todos: s.todos.filter(t => !t.done) }));
    get().saveData();
  },

  // ─── REMINDERS ────────────────────────────────────
  addReminder: (title, datetime, note, recurring = 'none') => {
    const reminder: Reminder = {
      id: genId(),
      title: title.trim(),
      note,
      datetime,
      recurring,
      done: false,
    };
    set(s => ({
      reminders: [...s.reminders, reminder].sort((a, b) => a.datetime - b.datetime),
    }));
    get().saveData();
  },

  deleteReminder: (id) => {
    set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    get().saveData();
  },

  editReminder: (id, updates) => {
    set(s => ({
      reminders: s.reminders
        .map(r => r.id === id ? { ...r, ...updates } : r)
        .sort((a, b) => a.datetime - b.datetime),
    }));
    get().saveData();
  },

  markReminderDone: (id) => {
    const { reminders } = get();
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    if (reminder.recurring === 'none') {
      set(s => ({ reminders: s.reminders.filter(r => r.id !== id) }));
    } else {
      const next = reminder.recurring === 'daily' ? 86400000 : 604800000;
      set(s => ({
        reminders: s.reminders.map(r =>
          r.id === id ? { ...r, datetime: r.datetime + next } : r
        ).sort((a, b) => a.datetime - b.datetime),
      }));
    }
    get().saveData();
  },

  // ─── USAGE ────────────────────────────────────────
  recordSession: (minutes) => {
    const today = todayStr();
    set(s => {
      const existing = s.usage.find(u => u.date === today);
      if (existing) {
        return {
          usage: s.usage.map(u =>
            u.date === today
              ? { ...u, minutes: u.minutes + minutes, sessions: u.sessions + 1, lastOpen: Date.now() }
              : u
          ),
        };
      }
      const newDay: UsageDay = { date: today, minutes, sessions: 1, lastOpen: Date.now() };
      return { usage: [newDay, ...s.usage].slice(0, 30) };
    });
    get().saveData();
  },

  getTodayUsage: () => {
    const today = todayStr();
    return get().usage.find(u => u.date === today) || null;
  },

  startSession: () => {
    set({ _sessionStart: Date.now() });
  },

  endSession: () => {
    const start = get()._sessionStart;
    if (start) {
      const minutes = Math.round((Date.now() - start) / 60000);
      if (minutes > 0) get().recordSession(minutes);
      set({ _sessionStart: null });
    }
  },

  // ─── SETTINGS ─────────────────────────────────────
  updateSettings: (updates) => {
    set(s => ({ settings: { ...s.settings, ...updates } }));
    get().saveData();
  },

  // ─── PERSISTENCE ──────────────────────────────────
  loadData: async () => {
    try {
      const [todosRaw, remindersRaw, usageRaw, settingsRaw] = await Promise.all([
        AsyncStorage.getItem('eink_todos'),
        AsyncStorage.getItem('eink_reminders'),
        AsyncStorage.getItem('eink_usage'),
        AsyncStorage.getItem('eink_settings'),
      ]);
      set({
        todos: todosRaw ? JSON.parse(todosRaw) : [],
        reminders: remindersRaw ? JSON.parse(remindersRaw) : [],
        usage: usageRaw ? JSON.parse(usageRaw) : [],
        settings: settingsRaw ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsRaw) } : DEFAULT_SETTINGS,
      });
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  },

  saveData: async () => {
    try {
      const { todos, reminders, usage, settings } = get();
      await Promise.all([
        AsyncStorage.setItem('eink_todos', JSON.stringify(todos)),
        AsyncStorage.setItem('eink_reminders', JSON.stringify(reminders)),
        AsyncStorage.setItem('eink_usage', JSON.stringify(usage)),
        AsyncStorage.setItem('eink_settings', JSON.stringify(settings)),
      ]);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  },
}));
