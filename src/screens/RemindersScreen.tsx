// src/screens/RemindersScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';
import { useStore, Reminder } from '../store';
import { scheduleReminder, cancelReminder, formatReminderTime } from '../utils/notifications';

interface Props {
  navigation: any;
}

const RECURRING_OPTIONS: { label: string; value: Reminder['recurring'] }[] = [
  { label: 'Once', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

const ReminderItem: React.FC<{
  reminder: Reminder;
  onDelete: (id: string) => void;
  onDone: (id: string) => void;
}> = ({ reminder, onDelete, onDone }) => {
  const isPast = reminder.datetime < Date.now();
  const isUrgent = !isPast && reminder.datetime - Date.now() < 3600000; // < 1 hour

  const handleLongPress = () => {
    Alert.alert(
      'Reminder',
      reminder.title,
      [
        { text: 'Mark Done', onPress: () => onDone(reminder.id) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(reminder.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.reminderItem, isPast && styles.reminderItemPast]}
      onLongPress={handleLongPress}
      onPress={handleLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <View style={styles.reminderTimeCol}>
        <Text style={[
          styles.reminderTimeText,
          isPast ? styles.pastText : isUrgent ? styles.urgentText : undefined,
        ]}>
          {formatReminderTime(reminder.datetime)}
        </Text>
        {reminder.recurring !== 'none' && (
          <Text style={styles.recurringBadge}>↺ {reminder.recurring}</Text>
        )}
      </View>
      <View style={styles.reminderContent}>
        <Text style={[styles.reminderTitle, isPast && styles.pastText]} numberOfLines={1}>
          {reminder.title}
        </Text>
        {reminder.note ? (
          <Text style={styles.reminderNote} numberOfLines={1}>{reminder.note}</Text>
        ) : null}
        <Text style={styles.reminderDate}>
          {new Date(reminder.datetime).toLocaleDateString('en', {
            weekday: 'short', month: 'short', day: 'numeric',
          })} · {new Date(reminder.datetime).toLocaleTimeString('en', {
            hour: 'numeric', minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.reminderAction}>
        <Text style={styles.reminderDoneBtn}>✓</Text>
      </View>
    </TouchableOpacity>
  );
};

const AddReminderModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { addReminder } = useStore();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30, 0, 0);
    return d;
  });
  const [recurring, setRecurring] = useState<Reminder['recurring']>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const handleSave = () => {
    if (!title.trim()) return;
    const reminder_recurring_type = recurring === 'daily' ? 'day' : recurring === 'weekly' ? 'week' : undefined;
    const notifId = scheduleReminder(
      `r_${Date.now()}`,
      title.trim(),
      note.trim(),
      date,
      reminder_recurring_type as any,
    );
    addReminder(title.trim(), date.getTime(), note.trim() || undefined, recurring);
    setTitle('');
    setNote('');
    setRecurring('none');
    onClose();
  };

  const onDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    if (selected) setDate(selected);
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>New Reminder</Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Reminder title"
          placeholderTextColor={COLORS.ghostMid}
          autoCapitalize="sentences"
          maxLength={100}
          autoFocus
        />

        <TextInput
          style={[styles.input, styles.inputNote]}
          value={note}
          onChangeText={setNote}
          placeholder="Optional note"
          placeholderTextColor={COLORS.ghostMid}
          autoCapitalize="sentences"
          maxLength={200}
        />

        {/* Date/time pickers */}
        <Text style={styles.inputLabel}>DATE & TIME</Text>
        <View style={styles.datetimeRow}>
          <TouchableOpacity
            style={styles.dateTimeBtn}
            onPress={() => { setPickerMode('date'); setShowDatePicker(true); }}
          >
            <Text style={styles.dateTimeBtnText}>
              {date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeBtn}
            onPress={() => { setPickerMode('time'); setShowTimePicker(true); }}
          >
            <Text style={styles.dateTimeBtnText}>
              {date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {(showDatePicker || showTimePicker) && (
          <DateTimePicker
            value={date}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
          />
        )}

        {/* Recurrence */}
        <Text style={styles.inputLabel}>REPEAT</Text>
        <View style={styles.recurRow}>
          {RECURRING_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.recurBtn, recurring === opt.value && styles.recurBtnActive]}
              onPress={() => setRecurring(opt.value)}
            >
              <Text style={[
                styles.recurBtnText,
                recurring === opt.value && styles.recurBtnTextActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.saveBtnText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const RemindersScreen: React.FC<Props> = ({ navigation }) => {
  const { reminders, deleteReminder, markReminderDone } = useStore();
  const [showModal, setShowModal] = useState(false);

  const upcoming = reminders.filter(r => r.datetime >= Date.now()).slice(0, 50);
  const past = reminders.filter(r => r.datetime < Date.now()).slice(0, 10);
  const allSorted = [...upcoming, ...past];

  const handleDelete = (id: string) => {
    const r = reminders.find(rem => rem.id === id);
    if (r?.notificationId) cancelReminder(r.notificationId);
    deleteReminder(id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paperWhite} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {upcoming.length} upcoming · {past.length} past
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={allSorted}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            onDelete={handleDelete}
            onDone={markReminderDone}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◷</Text>
            <Text style={styles.emptyText}>No reminders set.</Text>
            <Text style={styles.emptySubText}>Tap ＋ to add one.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <AddReminderModal visible={showModal} onClose={() => setShowModal(false)} />
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
  addBtn: { minWidth: 64, alignItems: 'flex-end' },
  addBtnText: {
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkDark,
  },
  summary: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  summaryText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },

  // List
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  separator: {
    height: BORDERS.hairline,
    backgroundColor: COLORS.borderLight,
    marginLeft: SPACING.lg,
  },

  // Item
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  reminderItemPast: {
    opacity: 0.5,
  },
  reminderTimeCol: {
    width: 52,
    gap: 3,
    alignItems: 'flex-start',
  },
  reminderTimeText: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.inkDark,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  urgentText: { color: COLORS.accentAlert },
  pastText: { color: COLORS.ghostMid },
  recurringBadge: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
  },
  reminderContent: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
  },
  reminderNote: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 0.2,
  },
  reminderDate: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  reminderAction: {
    width: 32,
    alignItems: 'center',
  },
  reminderDoneBtn: {
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.ghostLight,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl * 2,
    gap: SPACING.md,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.ghostLight,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.medium,
    color: COLORS.ghostMid,
    fontStyle: 'italic',
  },
  emptySubText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostLight,
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  modal: {
    backgroundColor: COLORS.paperWhite,
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.borderMid,
    padding: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
    maxHeight: '85%',
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkBlack,
    marginBottom: SPACING.xs,
  },
  input: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
    padding: SPACING.md,
  },
  inputNote: {
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.inkMid,
  },
  inputLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: -SPACING.xs,
  },
  datetimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateTimeBtn: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
    alignItems: 'center',
  },
  dateTimeBtnText: {
    fontFamily: TYPOGRAPHY.serifMono,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.inkDark,
  },
  recurRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recurBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
  },
  recurBtnActive: {
    backgroundColor: COLORS.inkDark,
    borderColor: COLORS.inkDark,
  },
  recurBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 1,
  },
  recurBtnTextActive: {
    color: COLORS.paperWhite,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
  },
  cancelBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostDark,
    letterSpacing: 0.5,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.inkDark,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.ghostLight,
  },
  saveBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.paperWhite,
    letterSpacing: 1,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
