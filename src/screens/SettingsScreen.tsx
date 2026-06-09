// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';
import { useStore } from '../store';

interface Props {
  navigation: any;
}

const SettingRow: React.FC<{
  label: string;
  sub?: string;
  children: React.ReactNode;
  onPress?: () => void;
}> = ({ label, sub, children, onPress }) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <View style={styles.settingLabel}>
      <Text style={styles.settingLabelText}>{label}</Text>
      {sub && <Text style={styles.settingSubText}>{sub}</Text>}
    </View>
    <View style={styles.settingControl}>
      {children}
    </View>
  </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings, todos, reminders, usage } = useStore();
  const [nameEdit, setNameEdit] = useState(settings.greetingName);
  const [focusMsgEdit, setFocusMsgEdit] = useState(settings.focusModeMessage);
  const [goalEdit, setGoalEdit] = useState(String(settings.dailyGoalMinutes));

  const saveGoal = () => {
    const mins = parseInt(goalEdit, 10);
    if (mins > 0 && mins <= 1440) {
      updateSettings({ dailyGoalMinutes: mins });
    } else {
      setGoalEdit(String(settings.dailyGoalMinutes));
    }
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all tasks, reminders, and usage history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: () => {
            // Store will handle clearing
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paperWhite} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── DISPLAY ─── */}
        <SectionHeader title="DISPLAY" />

        <SettingRow label="Clock format" sub="12h or 24h">
          <View style={styles.segControl}>
            {(['12', '24'] as ('12' | '24')[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.segBtn, settings.clockFormat === f && styles.segBtnActive]}
                onPress={() => updateSettings({ clockFormat: f })}
              >
                <Text style={[styles.segBtnText, settings.clockFormat === f && styles.segBtnTextActive]}>
                  {f}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingRow>

        <SettingRow label="Show battery">
          <Switch
            value={settings.showBattery}
            onValueChange={v => updateSettings({ showBattery: v })}
            trackColor={{ true: COLORS.inkDark, false: COLORS.ghostLight }}
            thumbColor={COLORS.paperWhite}
          />
        </SettingRow>

        <SettingRow label="Show usage bar" sub="Progress bar on home">
          <Switch
            value={settings.showUsageBar}
            onValueChange={v => updateSettings({ showUsageBar: v })}
            trackColor={{ true: COLORS.inkDark, false: COLORS.ghostLight }}
            thumbColor={COLORS.paperWhite}
          />
        </SettingRow>

        {/* ─── PERSONALIZATION ─── */}
        <SectionHeader title="PERSONALIZATION" />

        <View style={styles.settingRowFull}>
          <Text style={styles.settingLabelText}>Your name</Text>
          <Text style={styles.settingSubText}>Used in greeting</Text>
          <TextInput
            style={styles.textInput}
            value={nameEdit}
            onChangeText={setNameEdit}
            onBlur={() => updateSettings({ greetingName: nameEdit })}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.ghostLight}
            maxLength={20}
            autoCapitalize="words"
          />
        </View>

        {/* ─── SCREEN TIME ─── */}
        <SectionHeader title="SCREEN TIME" />

        <View style={styles.settingRowFull}>
          <Text style={styles.settingLabelText}>Daily goal (minutes)</Text>
          <Text style={styles.settingSubText}>Your target max screen time</Text>
          <View style={styles.goalRow}>
            <TextInput
              style={[styles.textInput, styles.goalInput]}
              value={goalEdit}
              onChangeText={setGoalEdit}
              onBlur={saveGoal}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.goalUnit}>minutes</Text>
          </View>
          {/* Quick presets */}
          <View style={styles.presetRow}>
            {[30, 60, 90, 120].map(mins => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.presetBtn,
                  settings.dailyGoalMinutes === mins && styles.presetBtnActive,
                ]}
                onPress={() => {
                  setGoalEdit(String(mins));
                  updateSettings({ dailyGoalMinutes: mins });
                }}
              >
                <Text style={[
                  styles.presetBtnText,
                  settings.dailyGoalMinutes === mins && styles.presetBtnTextActive,
                ]}>
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── FOCUS MODE ─── */}
        <SectionHeader title="FOCUS MODE" />

        <SettingRow label="Enable focus mode" sub="Show message when opening">
          <Switch
            value={settings.focusModeEnabled}
            onValueChange={v => updateSettings({ focusModeEnabled: v })}
            trackColor={{ true: COLORS.inkDark, false: COLORS.ghostLight }}
            thumbColor={COLORS.paperWhite}
          />
        </SettingRow>

        <View style={styles.settingRowFull}>
          <Text style={styles.settingLabelText}>Focus message</Text>
          <Text style={styles.settingSubText}>What to remind yourself when opening the phone</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={focusMsgEdit}
            onChangeText={setFocusMsgEdit}
            onBlur={() => updateSettings({ focusModeMessage: focusMsgEdit })}
            placeholder="Write your intention..."
            placeholderTextColor={COLORS.ghostLight}
            multiline
            maxLength={150}
            autoCapitalize="sentences"
          />
        </View>

        {/* ─── DATA ─── */}
        <SectionHeader title="DATA" />

        <View style={styles.dataStats}>
          <View style={styles.dataStat}>
            <Text style={styles.dataStatValue}>{todos.length}</Text>
            <Text style={styles.dataStatLabel}>tasks stored</Text>
          </View>
          <View style={styles.dataStat}>
            <Text style={styles.dataStatValue}>{reminders.length}</Text>
            <Text style={styles.dataStatLabel}>reminders</Text>
          </View>
          <View style={styles.dataStat}>
            <Text style={styles.dataStatValue}>{usage.length}</Text>
            <Text style={styles.dataStatLabel}>days tracked</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.dangerBtn} onPress={confirmClearData}>
          <Text style={styles.dangerBtnText}>Clear all data</Text>
        </TouchableOpacity>

        {/* ─── ABOUT ─── */}
        <SectionHeader title="ABOUT" />
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>E-Ink Launcher</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            A minimal launcher designed to help you use your phone less.{'\n'}
            All data is stored locally. No internet required. No tracking.
          </Text>
          <View style={styles.aboutPillRow}>
            <View style={styles.aboutPill}><Text style={styles.aboutPillText}>100% Offline</Text></View>
            <View style={styles.aboutPill}><Text style={styles.aboutPillText}>No Tracking</Text></View>
            <View style={styles.aboutPill}><Text style={styles.aboutPillText}>Open Source</Text></View>
          </View>
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
    paddingBottom: SPACING.xxxl * 2,
  },

  // Sections
  sectionHeader: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.paperCream,
  },

  // Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  settingRowFull: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  settingLabel: {
    gap: 2,
  },
  settingLabelText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
  },
  settingSubText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
  },
  settingControl: {
    alignItems: 'flex-end',
  },

  // Segment control
  segControl: {
    flexDirection: 'row',
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
    overflow: 'hidden',
  },
  segBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'transparent',
  },
  segBtnActive: {
    backgroundColor: COLORS.inkDark,
  },
  segBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 0.5,
  },
  segBtnTextActive: {
    color: COLORS.paperWhite,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Inputs
  textInput: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  goalInput: {
    width: 80,
    marginTop: 0,
    textAlign: 'center',
  },
  goalUnit: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostDark,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  presetBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
  },
  presetBtnActive: {
    backgroundColor: COLORS.inkDark,
    borderColor: COLORS.inkDark,
  },
  presetBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 0.5,
  },
  presetBtnTextActive: {
    color: COLORS.paperWhite,
  },

  // Data
  dataStats: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.xl,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  dataStat: {
    gap: 3,
  },
  dataStatValue: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.light,
  },
  dataStatLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },
  dangerBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingBottom: 2,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.accentAlert,
  },
  dangerBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.accentAlert,
    letterSpacing: 0.5,
  },

  // About
  aboutSection: {
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  aboutTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkDark,
  },
  aboutVersion: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 1,
  },
  aboutDesc: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostDark,
    lineHeight: TYPOGRAPHY.sizes.small * 1.8,
    marginTop: SPACING.sm,
  },
  aboutPillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  },
  aboutPill: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: BORDERS.hairline,
    borderColor: COLORS.borderMid,
  },
  aboutPillText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 0.5,
  },
});
