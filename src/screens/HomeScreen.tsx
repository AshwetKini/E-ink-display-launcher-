// src/screens/HomeScreen.tsx
import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';
import { useClock } from '../hooks/useClock';
import { useBattery } from '../hooks/useBattery';
import { useStore } from '../store';
import { formatReminderTime } from '../utils/notifications';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const UsageBar: React.FC<{ minutes: number; goal: number }> = ({ minutes, goal }) => {
  const pct = Math.min(minutes / goal, 1);
  const barWidth = (width - SPACING.lg * 2 - 2) * pct;
  const color = pct < 0.5 ? COLORS.accentSoft : pct < 0.85 ? COLORS.accentWarm : COLORS.accentAlert;

  return (
    <View style={styles.usageBarContainer}>
      <View style={styles.usageBarTrack}>
        <View style={[styles.usageBarFill, { width: barWidth, backgroundColor: color }]} />
      </View>
      <View style={styles.usageBarLabels}>
        <Text style={styles.usageBarText}>{minutes}m used</Text>
        <Text style={styles.usageBarText}>goal: {goal}m</Text>
      </View>
    </View>
  );
};

const FocusMode: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <View style={styles.focusOverlay}>
    <Text style={styles.focusMessage}>{message}</Text>
    <TouchableOpacity onPress={onDismiss} style={styles.focusDismiss}>
      <Text style={styles.focusDismissText}>I understand</Text>
    </TouchableOpacity>
  </View>
);

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const clock = useClock();
  const battery = useBattery();
  const { todos, reminders, settings, getTodayUsage, startSession, endSession, updateSettings } = useStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showFocus, setShowFocus] = React.useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    startSession();
    if (settings.focusModeEnabled) setShowFocus(true);
    return () => endSession();
  }, []);

  const pendingTodos = todos.filter(t => !t.done);
  const highPriority = pendingTodos.filter(t => t.priority === 'high');
  const upcomingReminders = reminders
    .filter(r => !r.done && r.datetime > Date.now())
    .slice(0, 3);

  const todayUsage = getTodayUsage();
  const usageMinutes = todayUsage?.minutes || 0;

  const dismissFocus = useCallback(() => {
    setShowFocus(false);
  }, []);

  const handleSwipe = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 100 && Math.abs(nativeEvent.translationY) < 50) {
        navigation.navigate('InstalledApps');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paperWhite} />

      {showFocus && (
        <FocusMode message={settings.focusModeMessage} onDismiss={dismissFocus} />
      )}

      <PanGestureHandler onHandlerStateChange={handleSwipe} activeOffsetX={20} activeOffsetY={[-20, 20]}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* ── STATUS BAR ── */}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {clock.dayOfWeek.slice(0, 3).toUpperCase()}
          </Text>
          <View style={styles.statusRight}>
            {settings.showBattery && (
              <Text style={styles.batteryText}>
                {battery.charging ? '⚡' : ''}{battery.level}%
              </Text>
            )}
          </View>
        </View>

        {/* ── CLOCK ── */}
        <View style={styles.clockSection}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{clock.hours}</Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Text style={styles.timeText}>{clock.minutes}</Text>
            {settings.clockFormat === '12' && (
              <Text style={styles.ampmText}>{clock.ampm}</Text>
            )}
          </View>
          <Text style={styles.dateText}>
            {clock.date} {clock.month.slice(0, 3)} {clock.year}
          </Text>
        </View>

        {/* ── GREETING ── */}
        {settings.greetingName ? (
          <Text style={styles.greetingText}>
            {clock.greeting}, {settings.greetingName}.
          </Text>
        ) : (
          <Text style={styles.greetingText}>{clock.greeting}.</Text>
        )}

        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>Swipe right to view installed apps</Text>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── USAGE BAR ── */}
          {settings.showUsageBar && (
            <UsageBar minutes={usageMinutes} goal={settings.dailyGoalMinutes} />
          )}

          {/* ── HIGH PRIORITY TODOS ── */}
          {highPriority.length > 0 && (
            <TouchableOpacity
              style={styles.section}
              onPress={() => navigation.navigate('Todos')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLabel}>URGENT</Text>
              {highPriority.slice(0, 3).map(todo => (
                <View key={todo.id} style={styles.urgentItem}>
                  <Text style={styles.urgentDot}>◆</Text>
                  <Text style={styles.urgentText} numberOfLines={1}>{todo.text}</Text>
                </View>
              ))}
              {highPriority.length > 3 && (
                <Text style={styles.moreText}>+{highPriority.length - 3} more</Text>
              )}
            </TouchableOpacity>
          )}

          {/* ── UPCOMING REMINDERS ── */}
          {upcomingReminders.length > 0 && (
            <TouchableOpacity
              style={styles.section}
              onPress={() => navigation.navigate('Reminders')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLabel}>COMING UP</Text>
              {upcomingReminders.map(reminder => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <Text style={styles.reminderTime}>
                    {formatReminderTime(reminder.datetime)}
                  </Text>
                  <Text style={styles.reminderTitle} numberOfLines={1}>
                    {reminder.title}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          )}

          {/* ── EMPTY STATE ── */}
          {highPriority.length === 0 && upcomingReminders.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nothing pressing.</Text>
              <Text style={styles.emptyStateSubtext}>A clear mind is a productive mind.</Text>
            </View>
          )}

          {/* ── STATS ROW ── */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statChip}
              onPress={() => navigation.navigate('Todos')}
            >
              <Text style={styles.statNumber}>{pendingTodos.length}</Text>
              <Text style={styles.statLabel}>tasks</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statChip}
              onPress={() => navigation.navigate('Reminders')}
            >
              <Text style={styles.statNumber}>{upcomingReminders.length}</Text>
              <Text style={styles.statLabel}>reminders</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statChip}
              onPress={() => navigation.navigate('Usage')}
            >
              <Text style={styles.statNumber}>{usageMinutes}</Text>
              <Text style={styles.statLabel}>min today</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── NAV DOCK ── */}
        <View style={styles.dock}>
          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => navigation.navigate('Todos')}
            activeOpacity={0.6}
          >
            <Text style={styles.dockIcon}>☐</Text>
            <Text style={styles.dockLabel}>Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => navigation.navigate('Reminders')}
            activeOpacity={0.6}
          >
            <Text style={styles.dockIcon}>◷</Text>
            <Text style={styles.dockLabel}>Remind</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => navigation.navigate('Usage')}
            activeOpacity={0.6}
          >
            <Text style={styles.dockIcon}>▤</Text>
            <Text style={styles.dockLabel}>Usage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dockButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.6}
          >
            <Text style={styles.dockIcon}>⚙</Text>
            <Text style={styles.dockLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paperWhite,
  },
  content: {
    flex: 1,
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  statusText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  batteryText: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 0.5,
  },

  // Clock
  clockSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeText: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.massive,
    color: COLORS.inkBlack,
    fontWeight: TYPOGRAPHY.weights.light,
    lineHeight: TYPOGRAPHY.sizes.massive * 1.1,
    letterSpacing: -2,
  },
  timeSeparator: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.massive * 0.8,
    color: COLORS.ghostMid,
    marginBottom: 6,
    marginHorizontal: 2,
    fontWeight: TYPOGRAPHY.weights.light,
  },
  ampmText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostDark,
    marginBottom: 14,
    marginLeft: SPACING.sm,
    letterSpacing: 1,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  dateText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.ghostDark,
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  },

  // Greeting
  greetingText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.medium,
    color: COLORS.inkMid,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    height: BORDERS.hairline,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  // Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },

  // Usage bar
  usageBarContainer: {
    gap: SPACING.xs,
  },
  usageBarTrack: {
    height: 3,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  usageBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageBarText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },

  // Urgent todos
  urgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  urgentDot: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.accentAlert,
  },
  urgentText: {
    flex: 1,
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
  },
  moreText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },

  // Reminders
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  reminderTime: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.accentWarm,
    letterSpacing: 0.5,
    minWidth: 44,
  },
  reminderTitle: {
    flex: 1,
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
  },

  // Empty state
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyStateText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkMid,
    fontStyle: 'italic',
  },
  emptyStateSubtext: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: BORDERS.hairline,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: BORDERS.hairline,
    backgroundColor: COLORS.borderLight,
  },
  statNumber: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.light,
  },
  statLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 1,
  },

  // Dock
  dock: {
    flexDirection: 'row',
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.borderMid,
    backgroundColor: COLORS.paperCream,
    paddingBottom: SPACING.sm,
  },
  dockButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: 3,
  },
  swipeHint: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  swipeHintText: {
    color: COLORS.inkMuted,
    fontSize: TYPOGRAPHY.sizes.small,
    letterSpacing: 0.2,
  },
  dockIcon: {
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkMid,
  },
  dockLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 1,
  },

  // Focus mode
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.paperWhite,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
    gap: SPACING.xxl,
  },
  focusMessage: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkDark,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.xlarge * 1.6,
    fontStyle: 'italic',
  },
  focusDismiss: {
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.inkMid,
    paddingBottom: 2,
  },
  focusDismissText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.inkMid,
    letterSpacing: 1,
  },
});
