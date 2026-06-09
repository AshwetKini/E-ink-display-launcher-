# E-Ink Launcher

A minimal Android launcher inspired by e-ink paper displays, designed to reduce screen time and encourage intentional phone use.

```
┌─────────────────────────────────────┐
│  MON                          94%   │
│                                     │
│  09:41                              │
│        Wednesday, 8 Jan 2025        │
│                                     │
│  Good morning.                      │
│  ─────────────────────────────────  │
│  ████░░░░░░░░░░░░░░ 12m / 60m goal │
│                                     │
│  URGENT                             │
│  ◆ Review Q4 report                 │
│  ◆ Call the doctor                  │
│                                     │
│  COMING UP                          │
│  in 2h   Team standup               │
│  Tomorrow Design review             │
│                                     │
│  ─────────────────────────────────  │
│    3       1         12m            │
│  tasks  reminders  today            │
│  ─────────────────────────────────  │
│  ☐      ◷       ▤       ⚙         │
│ Tasks  Remind  Usage  Settings      │
└─────────────────────────────────────┘
```

---

## Philosophy

> Less is more. The best interface is the one you use least.

This launcher deliberately avoids:
- Color noise (paper whites + ink blacks only)
- Animation overload (subtle, purposeful transitions)
- Social media or distraction app shortcuts
- Internet connectivity (100% local)
- Ads, analytics, or tracking of any kind

---

## Features

### 🏠 Home Screen
- Large e-ink style clock (12/24h)
- Date, day, and personalized greeting
- Usage progress bar
- High-priority tasks surfaced at a glance
- Upcoming reminders preview
- Quick stats (tasks / reminders / today's usage)

### ☐ Tasks (Todos)
- Three priority levels: High (◆), Medium (◈), Low (◇)
- Tap to complete, long-press for edit/delete
- Smart sorting: high priority → medium → low, then by date
- Filter: Active / All / Done
- Progress bar showing completion ratio
- Clear completed tasks in one tap

### ◷ Reminders
- Local notifications (no internet needed)
- One-time, daily, or weekly recurrence
- Smart "time until" labels (in 2h / Tomorrow / Mon)
- Long-press to mark done or delete
- Past reminders shown dimmed

### ▤ Screen Time
- Tracks every session automatically (via AppState)
- 7-day bar chart with color-coded goal comparison
- Today's usage with goal progress bar
- Weekly stats: total / daily average / best day / sessions
- Mindful encouragement messages

### ⚙ Settings
- Clock format (12h / 24h)
- Show/hide battery
- Show/hide usage bar
- Your name (for greeting)
- Daily screen time goal with quick presets (30m / 1h / 1.5h / 2h)
- Focus mode: full-screen message on app open
- Data stats + clear all data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.73 (CLI) |
| Language | TypeScript |
| State | Zustand (local, no Redux overhead) |
| Persistence | AsyncStorage (local SQLite-backed) |
| Notifications | react-native-push-notification (local only) |
| Navigation | React Navigation (Stack) |
| Date picker | @react-native-community/datetimepicker |
| Device info | react-native-device-info |
| Gestures | react-native-gesture-handler |

---

## Prerequisites

- Node.js 18+
- Java 17 (JDK)
- Android Studio + Android SDK
- React Native CLI: `npm install -g react-native-cli`
- Android device or emulator (API 26+)

---

## Setup & Installation

### 1. Clone and install

```bash
git clone <your-repo>
cd EinkLauncher
npm install
```

### 2. Android setup

```bash
# Link native modules
cd android && ./gradlew clean && cd ..

# For react-native-vector-icons (required)
# Add to android/app/build.gradle:
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### 3. Run on device

```bash
# Start Metro bundler
npm start

# In another terminal — build and install
npm run android
```

### 4. Set as default launcher

After installing:
1. Press the **Home button**
2. Android will ask "Select Home App"
3. Choose **E-Ink Launcher**
4. Select **Always**

---

## Project Structure

```
EinkLauncher/
├── App.tsx                    # Root: navigation + app lifecycle
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main launcher face
│   │   ├── TodosScreen.tsx    # Task manager
│   │   ├── RemindersScreen.tsx # Reminder manager + notifications
│   │   ├── UsageScreen.tsx    # Screen time tracking
│   │   └── SettingsScreen.tsx # All settings
│   ├── store/
│   │   └── index.ts           # Zustand store (todos, reminders, usage, settings)
│   ├── hooks/
│   │   ├── useClock.ts        # Live clock hook (1s updates)
│   │   └── useBattery.ts      # Battery level + charging status
│   └── utils/
│       ├── theme.ts           # Design system (colors, typography, spacing)
│       └── notifications.ts   # Local notification helpers
└── android/
    └── app/src/main/
        └── AndroidManifest.xml # Launcher + notification permissions
```

---

## Design System

### Colors
```
Paper whites:   #F5F0E8  #EDE8DC  #E8E2D4
Ink blacks:     #1A1814  #2C2820  #3D3830
Ghost grays:    #C8C2B4  #A09890  #706860
Accent warm:    #8B6914  (old gold — important)
Accent alert:   #6B2D2D  (muted red — urgent)
Accent soft:    #2D4A3E  (forest — done/good)
```

### Typography
- **Numbers/Time**: `Courier New` — monospaced for stable clock
- **Body/Headings**: `Georgia` — classical serif, warm reading feel
- **Labels/UI**: `sans-serif` — clean system font

### Spacing
`4 / 8 / 16 / 24 / 32 / 48 / 64` — strict 8pt grid

---

## Production Checklist

### Before release:
- [ ] Replace `ic_notification` in AndroidManifest with actual small icon
- [ ] Add a proper `ic_launcher` icon (paper + ink aesthetic)
- [ ] Sign the APK: `android/app/build.gradle` → signingConfigs
- [ ] Test on Android 8.0 (API 26) through 14 (API 34)
- [ ] Test notification delivery after device reboot
- [ ] Test battery drain (sessions tracked efficiently)
- [ ] Test with large data sets (500+ todos, 100+ reminders)

### Android performance:
```gradle
// android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
      shrinkResources true
    }
  }
}
```

### Build release APK:
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Permissions Explained

| Permission | Why |
|-----------|-----|
| `RECEIVE_BOOT_COMPLETED` | Re-schedule notifications after reboot |
| `SCHEDULE_EXACT_ALARM` | Precise reminder delivery |
| `POST_NOTIFICATIONS` | Android 13+ notification permission |
| `READ_PHONE_STATE` | Battery level reading |
| `WAKE_LOCK` | Ensure notifications fire when screen is off |

No location, camera, contacts, or network permissions needed.

---

## Extending the Launcher

### Add more app shortcuts
The launcher intentionally has no app drawer — this is by design. To add curated shortcuts:

```tsx
// In HomeScreen.tsx, add to the dock:
<TouchableOpacity onPress={() => Linking.openURL('intent://...')}>
  <Text>Phone</Text>
</TouchableOpacity>
```

### Custom fonts
Drop `.ttf` files into `android/app/src/main/assets/fonts/` and reference them in `theme.ts`.

### Widgets
Use `react-native-reanimated` for custom animated widgets on the home screen.

---

## License

MIT — use freely, credit appreciated.

---

*"The best interface is the one you forget you're using."*
