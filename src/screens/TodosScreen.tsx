// src/screens/TodosScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';
import { useStore, Todo, Priority } from '../store';

interface Props {
  navigation: any;
}

const PRIORITY_CONFIG = {
  high: { label: 'HIGH', color: COLORS.accentAlert, symbol: '◆' },
  medium: { label: 'MED', color: COLORS.accentWarm, symbol: '◈' },
  low: { label: 'LOW', color: COLORS.ghostDark, symbol: '◇' },
};

const TodoItem: React.FC<{
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}> = ({ todo, onToggle, onDelete, onEdit }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const p = PRIORITY_CONFIG[todo.priority];

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => onToggle(todo.id));
  };

  const handleLongPress = () => {
    Alert.alert(
      'Task Options',
      todo.text,
      [
        { text: 'Edit', onPress: () => onEdit(todo) },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(todo.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Animated.View style={[styles.todoItem, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.todoInner}
        onPress={handleToggle}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.todoLeft}>
          <Text style={[styles.todoCheck, todo.done && styles.todoCheckDone]}>
            {todo.done ? '☑' : '☐'}
          </Text>
        </View>
        <View style={styles.todoCenter}>
          <Text style={[styles.todoText, todo.done && styles.todoTextDone]} numberOfLines={2}>
            {todo.text}
          </Text>
          {todo.dueDate && !todo.done && (
            <Text style={styles.todoDue}>
              Due {new Date(todo.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
        <View style={styles.todoRight}>
          <Text style={[styles.prioritySymbol, { color: todo.done ? COLORS.ghostLight : p.color }]}>
            {p.symbol}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AddTodoModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  editTodo?: Todo;
}> = ({ visible, onClose, editTodo }) => {
  const { addTodo, editTodo: savEdit } = useStore();
  const [text, setText] = useState(editTodo?.text || '');
  const [priority, setPriority] = useState<Priority>(editTodo?.priority || 'medium');
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible) {
      setText(editTodo?.text || '');
      setPriority(editTodo?.priority || 'medium');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, editTodo]);

  const handleSave = () => {
    if (!text.trim()) return;
    if (editTodo) {
      savEdit(editTodo.id, text, priority);
    } else {
      addTodo(text, priority);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>{editTodo ? 'Edit Task' : 'New Task'}</Text>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="What needs to be done?"
          placeholderTextColor={COLORS.ghostMid}
          multiline
          maxLength={200}
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Text style={styles.inputLabel}>PRIORITY</Text>
        <View style={styles.priorityRow}>
          {(['high', 'medium', 'low'] as Priority[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityBtn,
                priority === p && styles.priorityBtnActive,
                { borderColor: PRIORITY_CONFIG[p].color },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[
                styles.priorityBtnText,
                { color: priority === p ? PRIORITY_CONFIG[p].color : COLORS.ghostMid },
              ]}>
                {PRIORITY_CONFIG[p].symbol} {PRIORITY_CONFIG[p].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !text.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!text.trim()}
          >
            <Text style={styles.saveBtnText}>{editTodo ? 'Save' : 'Add Task'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

type Filter = 'all' | 'active' | 'done';

export const TodosScreen: React.FC<Props> = ({ navigation }) => {
  const { todos, toggleTodo, deleteTodo, clearDone } = useStore();
  const [filter, setFilter] = useState<Filter>('active');
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setShowModal(true);
  }, []);

  const handleAddNew = () => {
    setEditingTodo(undefined);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTodo(undefined);
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  }).sort((a, b) => {
    // Priority order: high > medium > low, then by date
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (!a.done && !b.done && a.priority !== b.priority) {
      return pOrder[a.priority] - pOrder[b.priority];
    }
    return b.createdAt - a.createdAt;
  });

  const doneCount = todos.filter(t => t.done).length;
  const activeCount = todos.filter(t => !t.done).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paperWhite} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity onPress={handleAddNew} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: todos.length > 0
                  ? `${(doneCount / todos.length) * 100}%`
                  : '0%',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {doneCount} of {todos.length} complete
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['active', 'all', 'done'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'active' ? `Active (${activeCount})` : f === 'done' ? `Done (${doneCount})` : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={handleEdit}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>☐</Text>
              <Text style={styles.emptyText}>
                {filter === 'done' ? 'Nothing completed yet.' : 'All clear.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            doneCount > 0 && filter !== 'active' ? (
              <TouchableOpacity style={styles.clearDoneBtn} onPress={clearDone}>
                <Text style={styles.clearDoneText}>Clear completed tasks</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      {/* Modal */}
      <AddTodoModal
        visible={showModal}
        onClose={handleCloseModal}
        editTodo={editingTodo}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paperWhite,
  },

  // Header
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
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkBlack,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  addBtn: {
    minWidth: 64,
    alignItems: 'flex-end',
  },
  addBtnText: {
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkDark,
  },

  // Progress
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  progressBar: {
    height: 2,
    backgroundColor: COLORS.borderLight,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accentSoft,
  },
  progressText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostMid,
    letterSpacing: 0.5,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterTab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: COLORS.inkDark,
  },
  filterTabText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 1,
  },
  filterTabTextActive: {
    color: COLORS.inkBlack,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  // List
  listContent: {
    paddingBottom: SPACING.xxxl,
  },

  // Todo item
  todoItem: {
    marginHorizontal: SPACING.lg,
    marginBottom: 1,
  },
  todoInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  todoLeft: {
    paddingTop: 2,
  },
  todoCheck: {
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkDark,
  },
  todoCheckDone: {
    color: COLORS.ghostLight,
  },
  todoCenter: {
    flex: 1,
    gap: 3,
  },
  todoText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
    lineHeight: TYPOGRAPHY.sizes.body * 1.5,
  },
  todoTextDone: {
    color: COLORS.ghostMid,
    textDecorationLine: 'line-through',
  },
  todoDue: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.accentWarm,
    letterSpacing: 0.3,
  },
  todoRight: {
    paddingTop: 4,
  },
  prioritySymbol: {
    fontSize: TYPOGRAPHY.sizes.small,
  },

  // Empty
  emptyState: {
    flex: 1,
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

  // Clear done
  clearDoneBtn: {
    alignSelf: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.ghostMid,
  },
  clearDoneText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    color: COLORS.ghostDark,
    letterSpacing: 1,
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
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkBlack,
    marginBottom: SPACING.sm,
  },
  input: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
    padding: SPACING.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostDark,
    letterSpacing: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: BORDERS.thin,
    borderColor: COLORS.borderMid,
  },
  priorityBtnActive: {
    backgroundColor: COLORS.paperCream,
  },
  priorityBtnText: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.tiny,
    letterSpacing: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
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
