// src/screens/UsageScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';
import { useStore, UsageDay } from '../store';

interface Props {
  navigation: any;
}

const { width } = Dimensions.get('window');
const BAR_AREA = width - SPACING.lg * 2;

const UsageChart: React.FC<{ days: UsageDay[]; goal: number }> = ({ days, goal }) => {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const found = days.find(u => u.date === key);
    return {
      date: key,
      dayLabel: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      minutes: found?.minutes || 0,
      sessions: found?.sessions || 0,
    };
  });

  const maxMinutes = Math.max(...last7.map(d => d.minutes), goal, 30);
  const barWidth = (BAR_AREA - (7 - 1) * SPACING.xs) / 7;

  const getBarColor = (minutes: number) => {
    const ratio = minutes / goal;
    if (ratio < 0.5) return COLORS.accentSoft;
    if (ratio < 0.85) return COLORS.accentWarm;
    return COLORS.accentAlert;
  };

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.chartArea}>
        {/* Goal line */}
        <View style={[
          chartStyles.goalLine,
          { bottom: (goal / maxMinutes) * 120 },
        ]}>
          <Text style={chartStyles.goalLabel}>goal</Text>
        </View>

        {/* Bars */}
        <View style={chartStyles.barsRow}>
          {last7.map((day, i) => {
            const barH = Math.max((day.minutes / maxMinutes) * 120, day.minutes > 0 ? 3 : 0);
            const isToday = i === 6;
            return (
              <View key={day.date} style={[chartStyles.barCol, { width: barWidth }]}>
                <View style={chartStyles.barWrapper}>
                  <View
                    style={[
                      chartStyles.bar,
                      {
                        height: barH,
                        width: barWidth,
                        backgroundColor: day.minutes > 0 ? getBarColor(day.minutes) : COLORS.borderLight,
                        opacity: isToday ? 1 : 0.7,
                      },
                    ]}
                  />
                </View>
                <Text style={[chartStyles.dayLabel, isToday && chartStyles.dayLabelToday]}>
                  {day.dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.accentSoft }]} />
          <Text style={chartStyles.legendText}>Under goal</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.accentWarm }]} />
          <Text style={chartStyles.legendText}>Near goal</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.accentAlert }]} />
          <Text style={chartStyles.legendText}>Over goal</Text>
        </View>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  chartArea: {
    height: 160,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BORDERS.hairline,
    backgroundColor: COLORS.borderMid,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalLabel: {
    position: 'absolute',
    right: 0,
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
    top: -8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
    height: 120,
  },
  barCol: {
    alignItems: 'center',
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 1,
  },
  dayLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
  legendText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
  },
});

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}> = ({ label, value, sub, accent }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCardLabel}>{label}</Text>
    <Text style={[styles.statCardValue, accent ? { color: accent } : undefined]}>{value}</Text>
    {sub && <Text style={styles.statCardSub}>{sub}</Text>}
  </View>
);

export const UsageScreen: React.FC<Props> = ({ navigation }) => {
  const { usage, settings } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayData = usage.find(u => u.date === today);
  const todayMinutes = todayData?.minutes || 0;
  const todayGoal = settings.dailyGoalMinutes;

  const last7 = usage.filter(u => {
    const d = new Date(u.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return d >= cutoff;
  });

  const weekTotal = last7.reduce((s, d) => s + d.minutes, 0);
  const weekAvg = last7.length > 0 ? Math.round(weekTotal / 7) : 0;
  const bestDay = last7.reduce((best, d) =>
    (!best || d.minutes < best.minutes) && d.minutes > 0 ? d : best
  , null as UsageDay | null);

  const goalRatio = todayMinutes / todayGoal;
  const todayColor = goalRatio < 0.5 ? COLORS.accentSoft
    : goalRatio < 0.85 ? COLORS.accentWarm : COLORS.accentAlert;

  const getStatusMessage = () => {
    if (todayMinutes === 0) return 'Great start — no usage yet.';
    if (goalRatio < 0.5) return 'Well under your goal. Keep it up.';
    if (goalRatio < 0.85) return `${Math.round((1 - goalRatio) * todayGoal)}m remaining today.`;
    if (goalRatio < 1) return 'Almost at your limit. Wind down.';
    return `Over goal by ${todayMinutes - todayGoal}m. Consider stepping away.`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paperWhite} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Time</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Today hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>TODAY</Text>
          <Text style={[styles.heroValue, { color: todayColor }]}>
            {todayMinutes > 0 ? `${todayMinutes}m` : '—'}
          </Text>
          <Text style={styles.heroSub}>{getStatusMessage()}</Text>

          {/* Today bar */}
          <View style={styles.todayBar}>
            <View style={styles.todayBarTrack}>
              <View style={[
                styles.todayBarFill,
                {
                  width: `${Math.min(goalRatio, 1) * 100}%`,
                  backgroundColor: todayColor,
                },
              ]} />
            </View>
            <Text style={styles.todayBarLabel}>
              {todayMinutes}m / {todayGoal}m goal
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 7-day chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-DAY OVERVIEW</Text>
          <UsageChart days={last7} goal={todayGoal} />
        </View>

        <View style={styles.divider} />

        {/* Stats grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total"
              value={`${weekTotal}m`}
              sub={`${Math.floor(weekTotal / 60)}h ${weekTotal % 60}m`}
            />
            <StatCard
              label="Daily avg"
              value={`${weekAvg}m`}
              accent={weekAvg > todayGoal ? COLORS.accentAlert : COLORS.inkDark}
            />
            <StatCard
              label="Best day"
              value={bestDay ? `${bestDay.minutes}m` : '—'}
              sub={bestDay ? new Date(bestDay.date + 'T12:00').toLocaleDateString('en', { weekday: 'short' }) : undefined}
              accent={COLORS.accentSoft}
            />
            <StatCard
              label="Sessions"
              value={String(last7.reduce((s, d) => s + d.sessions, 0))}
              sub="app opens"
            />
          </View>
        </View>

        {/* Mindful tip */}
        <View style={styles.tipSection}>
          <Text style={styles.tipText}>
            {weekAvg <= todayGoal
              ? "You're doing well. Awareness is the first step to intentional living."
              : "Small reductions compound. Even 10 minutes less per day is an hour a week."
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paperWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: { minWidth: 64 },
  backText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostDark,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkBlack,
  },

  content: {
    paddingBottom: SPACING.xxxl,
  },
  divider: {
    height: BORDERS.hairline,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.lg,
  },

  // Hero
  heroSection: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  heroLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 3,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  heroValue: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.hero,
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.light,
    letterSpacing: -2,
    lineHeight: TYPOGRAPHY.sizes.hero * 1.1,
  },
  heroSub: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.ghostDark,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  todayBar: {
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  todayBarTrack: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  todayBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  todayBarLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },

  // Section
  section: {
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.borderLight,
    gap: 3,
  },
  statCardLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 1,
  },
  statCardValue: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.light,
  },
  statCardSub: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
  },

  // Tip
  tipSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.lg,
    borderTopWidth: BORDERS.hairline,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.sm,
  },
  tipText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.ghostDark,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.body * 1.7,
    textAlign: 'center',
  },
});
